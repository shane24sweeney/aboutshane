package com.aboutshane.contactapi.visitors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

class VisitorStatsTest {
    private final HttpClient http = mock(HttpClient.class);
    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-11-21T12:00:00Z"));
    private final Clock clock = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now.get(); }
    };
    private final VisitorStats stats = new VisitorStats(URI.create("https://example.test/visitors.json"), http, new ObjectMapper(), clock);

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void answer(int status, String body) throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn((HttpResponse) response);
    }

    @Test
    void readsTheExportAndKeepsItForTenMinutes() throws Exception {
        answer(200, VisitorsControllerTest.EXPORT);
        assertThat(stats.latest()).hasValueSatisfying(s -> assertThat(s.path("totals").path("users").asInt()).isEqualTo(619));
        now.set(now.get().plus(Duration.ofMinutes(9)));
        stats.latest();
        verify(http, times(1)).send(any(), any(HttpResponse.BodyHandler.class));
        now.set(now.get().plus(Duration.ofMinutes(2)));
        stats.latest();
        verify(http, times(2)).send(any(), any(HttpResponse.BodyHandler.class));
    }

    @Tag("negative")
    @Test
    void treatsAMissingFileOrBrokenNetworkAsNotAvailable() throws Exception {
        answer(404, "Not Found");
        assertThat(stats.latest()).isEmpty();
        now.set(now.get().plus(Duration.ofMinutes(11)));
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenThrow(new IOException("connection refused"));
        assertThat(stats.latest()).isEmpty();
    }

    @Tag("negative")
    @Test
    void rejectsAnExportInTheWrongShape() throws Exception {
        answer(200, "{\"version\":2,\"totals\":{},\"countries\":[],\"generatedAt\":\"x\"}");
        assertThat(stats.latest()).isEmpty();
        now.set(now.get().plus(Duration.ofMinutes(11)));
        answer(200, "{\"version\":1,\"totals\":{},\"countries\":{}}");
        assertThat(stats.latest()).isEmpty();
    }
}

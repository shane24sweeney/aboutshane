package com.aboutshane.contactapi.status;

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
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

class QualityReportTest {
    private final HttpClient http = mock(HttpClient.class);
    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-11-21T12:00:00Z"));
    private final Clock clock = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now.get(); }
    };
    private final QualityReport report = new QualityReport(URI.create("https://example.test/metrics.json"), http, new ObjectMapper(), clock);

    @SuppressWarnings("unchecked")
    private void answer(int status, String body) throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn((HttpResponse) response);
    }

    @Test
    void readsTheVerdictAndKeepsItForTenMinutes() throws Exception {
        answer(200, "{\"status\":\"healthy\",\"statusText\":\"Healthy\",\"headline\":\"All passed\",\"day\":\"Today\",\"reportUrl\":\"https://r/\",\"kpis\":[]}");

        assertThat(report.latest()).hasValueSatisfying(v -> assertThat(v.headline()).isEqualTo("All passed"));
        now.set(now.get().plus(Duration.ofMinutes(9)));
        report.latest();
        verify(http, times(1)).send(any(), any(HttpResponse.BodyHandler.class));

        now.set(now.get().plus(Duration.ofMinutes(2)));
        report.latest();
        verify(http, times(2)).send(any(), any(HttpResponse.BodyHandler.class));
    }

    @Tag("negative")
    @Test
    void leavesTheVerdictOutWhenTheReportIsDown() throws Exception {
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenThrow(new IOException("connection refused"));
        assertThat(report.latest()).isEmpty();
    }

    @Tag("negative")
    @Test
    void leavesTheVerdictOutForAnErrorOrUnexpectedJson() throws Exception {
        answer(503, "unavailable");
        assertThat(report.latest()).isEmpty();
        now.set(now.get().plus(Duration.ofMinutes(11)));
        answer(200, "{\"something\":\"else\"}");
        assertThat(report.latest()).isEmpty();
    }

    @Test
    void sharesTheWholeReportFromTheSameRead() throws Exception {
        answer(200, "{\"status\":\"healthy\",\"development\":{\"ui\":{\"total\":124}}}");
        assertThat(report.metrics()).hasValueSatisfying(m -> assertThat(m.at("/development/ui/total").asInt()).isEqualTo(124));
        assertThat(report.latest()).hasValueSatisfying(v -> assertThat(v.status()).isEqualTo("healthy"));
        verify(http, times(1)).send(any(), any(HttpResponse.BodyHandler.class));
    }

    @Tag("negative")
    @Test
    void ignoresAReportThatIsNotAnObject() throws Exception {
        answer(200, "[1, 2, 3]");
        assertThat(report.metrics()).isEmpty();
        assertThat(report.latest()).isEmpty();
    }
}

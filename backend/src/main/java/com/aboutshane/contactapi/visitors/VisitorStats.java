package com.aboutshane.contactapi.visitors;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Visitor numbers from Google Analytics, exported every morning by the daily workflow
 * (scripts/analytics/export.mjs) to visitors.json on GitHub Pages. Kept for ten minutes; a slow
 * or failed read, or a file in an unexpected shape, counts as "not available yet".
 */
@Component
public class VisitorStats {
    private static final Logger log = LoggerFactory.getLogger(VisitorStats.class);
    static final Duration KEEP = Duration.ofMinutes(10);
    static final Duration TIMEOUT = Duration.ofSeconds(2);

    private final URI source;
    private final HttpClient http;
    private final ObjectMapper json;
    private final Clock clock;
    private Optional<JsonNode> cached = Optional.empty();
    private Instant fetchedAt = Instant.MIN;

    @Autowired
    public VisitorStats(@Value("${visitors.url:https://shane24sweeney.github.io/aboutshane/visitors.json}") String source, ObjectMapper json) {
        this(URI.create(source), HttpClient.newBuilder().connectTimeout(TIMEOUT).build(), json, Clock.systemUTC());
    }

    VisitorStats(URI source, HttpClient http, ObjectMapper json, Clock clock) {
        this.source = source;
        this.http = http;
        this.json = json;
        this.clock = clock;
    }

    /** True when the export has the fields the Visitors page reads. */
    static boolean looksValid(JsonNode stats) {
        return stats.path("version").asInt() == 1
                && stats.path("totals").isObject()
                && stats.path("countries").isArray()
                && stats.path("generatedAt").isTextual();
    }

    public synchronized Optional<JsonNode> latest() {
        Instant now = clock.instant();
        if (Duration.between(fetchedAt, now).compareTo(KEEP) < 0) return cached;
        fetchedAt = now;
        try {
            HttpResponse<String> response = http.send(
                    HttpRequest.newBuilder(source).timeout(TIMEOUT).header("Accept", "application/json").GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new IllegalStateException("HTTP " + response.statusCode());
            JsonNode stats = json.readTree(response.body());
            cached = Optional.of(stats).filter(VisitorStats::looksValid);
            if (cached.isEmpty()) log.warn("visitors.json has an unexpected shape");
        } catch (Exception failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            log.warn("Visitor stats unavailable: {}", failure.toString());
            cached = Optional.empty();
        }
        return cached;
    }
}

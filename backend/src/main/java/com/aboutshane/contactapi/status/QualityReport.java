package com.aboutshane.contactapi.status;

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
 * The latest daily quality report's verdict, read from its metrics.json on GitHub Pages. Kept for
 * ten minutes so the status endpoint answers quickly; a slow or failed read just leaves it out.
 */
@Component
public class QualityReport {
    private static final Logger log = LoggerFactory.getLogger(QualityReport.class);
    static final Duration KEEP = Duration.ofMinutes(10);
    static final Duration TIMEOUT = Duration.ofSeconds(2);

    /** The parts of the report the status endpoint shares. */
    public record Verdict(String status, String statusText, String headline, String day, String reportUrl) {}

    private final URI source;
    private final HttpClient http;
    private final ObjectMapper json;
    private final Clock clock;
    private Optional<Verdict> cached = Optional.empty();
    private Instant fetchedAt = Instant.MIN;

    @Autowired
    public QualityReport(@Value("${quality.report-url:https://shane24sweeney.github.io/aboutshane/metrics.json}") String source,
            ObjectMapper json) {
        this(URI.create(source), HttpClient.newBuilder().connectTimeout(TIMEOUT).build(), json, Clock.systemUTC());
    }

    QualityReport(URI source, HttpClient http, ObjectMapper json, Clock clock) {
        this.source = source;
        this.http = http;
        this.json = json;
        this.clock = clock;
    }

    public synchronized Optional<Verdict> latest() {
        Instant now = clock.instant();
        if (Duration.between(fetchedAt, now).compareTo(KEEP) < 0) return cached;
        fetchedAt = now;
        try {
            HttpResponse<String> response = http.send(
                    HttpRequest.newBuilder(source).timeout(TIMEOUT).header("Accept", "application/json").GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new IllegalStateException("HTTP " + response.statusCode());
            JsonNode report = json.readTree(response.body());
            cached = Optional.of(new Verdict(
                    report.path("status").asText(null),
                    report.path("statusText").asText(null),
                    report.path("headline").asText(null),
                    report.path("day").asText(null),
                    report.path("reportUrl").asText(null)))
                    .filter(v -> v.status() != null);
        } catch (Exception failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            log.warn("Quality report unavailable: {}", failure.toString());
            cached = Optional.empty();
        }
        return cached;
    }
}

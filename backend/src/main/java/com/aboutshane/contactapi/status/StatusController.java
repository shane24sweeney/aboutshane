package com.aboutshane.contactapi.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import com.aboutshane.contactapi.content.ContentRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/status: what's running, since when, and how the latest daily tests went. */
@RestController
public class StatusController {
    private final BuildProperties build;
    private final ContentRepository content;
    private final QualityReport report;
    private final Clock clock;
    private final Instant started;

    public StatusController(ObjectProvider<BuildProperties> build, ContentRepository content, QualityReport report, ObjectProvider<Clock> clock) {
        this.build = build.getIfAvailable();
        this.content = content;
        this.report = report;
        this.clock = clock.getIfAvailable(Clock::systemUTC);
        this.started = this.clock.instant();
    }

    public record Content(int pages, int resumeRoles, int testimonials, int races) {}

    public record Status(
            String status,
            String version,
            Instant builtAt,
            Instant startedAt,
            long uptimeSeconds,
            String runtime,
            Content content,
            QualityReport.Verdict quality) {}

    @GetMapping("/api/status")
    public ResponseEntity<Status> status() {
        Instant now = clock.instant();
        Status body = new Status(
                "ok",
                build == null ? "dev" : build.getVersion(),
                build == null ? null : build.getTime(),
                started,
                Duration.between(started, now).toSeconds(),
                "Java " + Runtime.version().feature(),
                new Content(7, content.resume().size(), content.testimonials().size(), content.running().races().size()),
                report.latest().orElse(null));
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic()).body(body);
    }
}

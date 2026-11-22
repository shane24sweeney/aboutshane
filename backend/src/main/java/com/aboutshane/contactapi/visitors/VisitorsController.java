package com.aboutshane.contactapi.visitors;

import java.time.Duration;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/visitors: the last 30 days of visitors by country, pages, daily visitors and how fast
 * the site is (real visitors, the API and the load test). Before the first export it answers
 * {@code available: false} rather than an error, so the page can say the numbers are coming.
 */
@RestController
public class VisitorsController {
    private final VisitorStats stats;

    public VisitorsController(VisitorStats stats) {
        this.stats = stats;
    }

    @GetMapping("/api/visitors")
    public ResponseEntity<?> visitors() {
        CacheControl cache = CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic();
        return stats.latest()
                .<ResponseEntity<?>>map(body -> ResponseEntity.ok().cacheControl(cache).body(body))
                .orElseGet(() -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(1)).cachePublic())
                        .body(Map.of("available", false, "message", "Visitor numbers are collected daily; the first figures appear the morning after analytics starts.")));
    }
}

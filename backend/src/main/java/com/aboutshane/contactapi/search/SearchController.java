package com.aboutshane.contactapi.search;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/search?q=appium: every page's text, searched. CloudFront caches answers per query. */
@RestController
public class SearchController {
    static final CacheControl CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final SearchService search;

    public SearchController(SearchService search) {
        this.search = search;
    }

    public record SearchResponse(String query, int count, List<SearchService.Result> results) {}

    @GetMapping("/api/search")
    public ResponseEntity<?> search(@RequestParam(name = "q", required = false) String query) {
        String q = query == null ? "" : query.strip();
        if (q.length() < SearchService.MIN_LENGTH || q.length() > SearchService.MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "invalid_query",
                    "message", "Search for %d to %d characters.".formatted(SearchService.MIN_LENGTH, SearchService.MAX_LENGTH)));
        }
        List<SearchService.Result> results = search.search(q);
        return ResponseEntity.ok().cacheControl(CACHE).body(new SearchResponse(q, results.size(), results));
    }
}

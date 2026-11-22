package com.aboutshane.contactapi.search;

import static org.assertj.core.api.Assertions.assertThat;

import com.aboutshane.contactapi.content.ContentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class SearchServiceTest {
    private final SearchService search = new SearchService(new ContentRepository(new ObjectMapper()));

    @Test
    void foldsCaseAndAccents() {
        assertThat(SearchService.fold("Résumé SENIOR")).isEqualTo("resume senior");
    }

    @Test
    void splitsTheQueryIntoDistinctWords() {
        assertThat(SearchService.terms("  Appium, appium  iOS! ")).containsExactly("appium", "ios");
    }

    @Test
    void highlightsPointAtTheMatchedWordsInTheSnippet() {
        var results = search.search("playwright");
        assertThat(results).isNotEmpty();
        // A result can match on its title alone; when the snippet has the word, it is highlighted.
        assertThat(results).anySatisfy(result -> assertThat(result.highlights()).isNotEmpty());
        for (var result : results) {
            if (SearchService.fold(result.snippet()).contains("playwright")) assertThat(result.highlights()).isNotEmpty();
            for (var highlight : result.highlights()) {
                String marked = result.snippet().substring(highlight.start(), highlight.start() + highlight.length());
                assertThat(SearchService.fold(marked)).isEqualTo("playwright");
            }
        }
    }

    @Test
    void listsPagesInTheOrderAVisitorLooksAndTitleMatchesFirstWithinAPage() {
        var results = search.search("appium");
        var order = java.util.List.of("/home", "/resume", "/about", "/running", "/education", "/charity", "/testimonials");
        var positions = results.stream().map(r -> order.indexOf(r.path())).toList();
        assertThat(positions).isSorted();
        var resume = search.search("ameritas").stream().filter(r -> r.path().equals("/resume")).toList();
        assertThat(resume.getFirst().title()).containsIgnoringCase("Ameritas");
    }

    @Test
    void keepsSnippetsShortAndDropsBoldMarkers() {
        for (var result : search.search("automation")) {
            assertThat(result.snippet()).hasSizeLessThanOrEqualTo(165).doesNotContain("**");
        }
    }
}

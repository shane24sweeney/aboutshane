package com.aboutshane.contactapi.search;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aboutshane.contactapi.ApiExceptionHandler;
import com.aboutshane.contactapi.content.ContentRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SearchController.class)
@Import({ContentRepository.class, SearchService.class, ApiExceptionHandler.class})
class SearchControllerTest {
    @Autowired
    private MockMvc mvc;

    @Test
    void findsMatchesAcrossPagesAsCacheableJson() throws Exception {
        // given every page's text
        // when a visitor searches for "appium"
        mvc.perform(get("/api/search").param("q", "appium"))
                // then matches from more than one page come back, each with a link and a snippet
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.query").value("appium"))
                .andExpect(jsonPath("$.count", greaterThan(1)))
                .andExpect(jsonPath("$.results[*].path", hasItem("/home")))
                .andExpect(jsonPath("$.results[*].path", hasItem("/resume")))
                .andExpect(jsonPath("$.results[0].snippet").isString())
                .andExpect(jsonPath("$.results[*].highlights[*].length", hasItem(6)));
    }

    @Test
    void ignoresCase() throws Exception {
        // when a visitor searches in capitals
        mvc.perform(get("/api/search").param("q", "FIFTH THIRD"))
                // then the role is still found
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[*].page", hasItem("Resume")));
    }

    @Test
    void needsEveryWord() throws Exception {
        // when one of two words appears nowhere on the site
        mvc.perform(get("/api/search").param("q", "appium zzqx"))
                // then nothing matches
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void findsRacesByTown() throws Exception {
        mvc.perform(get("/api/search").param("q", "Helen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[*].path", hasItem("/running")));
    }

    @Test
    void returnsAnEmptyListWhenNothingMatches() throws Exception {
        mvc.perform(get("/api/search").param("q", "zzqx nothing"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0))
                .andExpect(jsonPath("$.results").isEmpty());
    }

    @Test
    void returnsAtMostTwentyResults() throws Exception {
        mvc.perform(get("/api/search").param("q", "the"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", lessThanOrEqualTo(SearchService.MAX_RESULTS)));
    }

    @Tag("negative")
    @ParameterizedTest
    @ValueSource(strings = {"", " ", "a"})
    void rejectsQueriesTooShortToBeUseful(String query) throws Exception {
        mvc.perform(get("/api/search").param("q", query))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_query"));
    }

    @Tag("negative")
    @Test
    void rejectsAMissingOrOverlongQuery() throws Exception {
        mvc.perform(get("/api/search")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/search").param("q", "x".repeat(SearchService.MAX_LENGTH + 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_query"));
    }

    @Tag("negative")
    @Test
    void treatsMarkupInTheQueryAsPlainText() throws Exception {
        mvc.perform(get("/api/search").param("q", "<script>alert(1)</script>"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("<script>alert(1)</script>"))
                .andExpect(jsonPath("$.count").value(0));
    }

    @Tag("negative")
    @Test
    void isReadOnly() throws Exception {
        mvc.perform(post("/api/search").param("q", "appium")).andExpect(status().isMethodNotAllowed());
    }
}

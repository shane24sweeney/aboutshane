package com.aboutshane.contactapi.content;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ContentController.class)
@Import(ContentRepository.class)
class ContentControllerTest {
    @Autowired
    private MockMvc mvc;

    @ParameterizedTest
    @ValueSource(strings = {"profile", "about", "resume", "testimonials", "education", "charity"})
    void everyPageIsServedAsCacheableJson(String page) throws Exception {
        // given the content API
        // when a page is requested
        mvc.perform(get("/api/content/" + page))
                // then it is served as JSON that CloudFront may cache for 5 minutes
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/json"))
                .andExpect(header().string("Cache-Control", "max-age=300, public"));
    }

    @Test
    void profileHasTheHeadlineAndStrengths() throws Exception {
        // given the content API
        // when the profile is requested
        mvc.perform(get("/api/content/profile"))
                // then it has the name, headline, strengths and highlights
                .andExpect(jsonPath("$.name").value("Shane James Sweeney"))
                .andExpect(jsonPath("$.headline").value("Senior QE & Mobile Automation Consultant"))
                .andExpect(jsonPath("$.strengths", hasSize(15)))
                .andExpect(jsonPath("$.highlights", hasSize(5)));
    }

    @Test
    void resumeListsEveryRoleNewestFirst() throws Exception {
        // given the content API
        // when the resume is requested
        mvc.perform(get("/api/content/resume"))
                // then it lists all 14 roles, the most recent first
                .andExpect(jsonPath("$", hasSize(14)))
                .andExpect(jsonPath("$[0].company").value("Fifth Third Bank"))
                .andExpect(jsonPath("$[0].contractVia").value("TEKsystems"))
                .andExpect(jsonPath("$[0].dates").value("2026"))
                .andExpect(jsonPath("$[0].highlights", hasSize(8)))
                .andExpect(jsonPath("$[1].contractVia").doesNotExist());
    }

    @Test
    void otherPagesHaveTheirEntries() throws Exception {
        // given the content API
        // when each list page is requested, then it has all its entries
        mvc.perform(get("/api/content/testimonials")).andExpect(jsonPath("$", hasSize(11)));
        mvc.perform(get("/api/content/education")).andExpect(jsonPath("$", hasSize(3)));
        mvc.perform(get("/api/content/charity"))
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[1].link.href").value("https://www.dogdaysrescue.org/"));
    }

    @Tag("negative")
    @ParameterizedTest(name = "{0} is not found")
    @ValueSource(strings = {"/api/content/secrets", "/api/content/PROFILE", "/api/content/profile/extra", "/api/content/", "/api/content"})
    void unknownPagesAreNotFound(String path) throws Exception {
        // given the content API
        // when a page that does not exist is requested
        mvc.perform(get(path))
                // then it answers 404 with a JSON error
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("request_rejected"));
    }

    @Tag("negative")
    @Test
    void contentIsReadOnly() throws Exception {
        // given the content API
        // when a page is posted to or deleted, then the method is not allowed
        mvc.perform(post("/api/content/profile").content("{}")).andExpect(status().isMethodNotAllowed());
        mvc.perform(delete("/api/content/resume")).andExpect(status().isMethodNotAllowed());
    }
}

package com.aboutshane.contactapi.content;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import com.aboutshane.contactapi.resume.LiveResume;
import com.aboutshane.contactapi.resume.LiveResumeTest;
import com.aboutshane.contactapi.status.QualityReport;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ContentController.class)
@Import({ContentRepository.class, LiveResume.class})
class ContentControllerTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private QualityReport report;

    @Test
    void resumeSideProjectsCarryTheLatestQualityReportNumbers() throws Exception {
        // given the latest daily quality report
        when(report.metrics()).thenReturn(Optional.of(LiveResumeTest.sample()));
        // when the resume is requested
        mvc.perform(get("/api/content/resume"))
                // then the side projects quote its numbers
                .andExpect(jsonPath("$[0].highlights[5]").value(containsString("124 Vitest unit tests")))
                .andExpect(jsonPath("$[0].highlights[6]").value(containsString("the latest daily run made 3,151 checks with 99.9% passing")))
                .andExpect(jsonPath("$[0].highlights[6]").value(containsString("typical response under load is 93 ms")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"profile", "about", "resume", "testimonials", "education", "charity", "running", "running/stats"})
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
                .andExpect(jsonPath("$.headline").value("Test Automation Architect · QA / Test Manager · Senior QE & Mobile Automation Consultant"))
                .andExpect(jsonPath("$.openTo").value("Open to front end development in React, HTML and CSS, and back end development in Java Spring Boot MVC: REST APIs with GET, PUT, POST and DELETE."))
                .andExpect(jsonPath("$.strengths", hasSize(15)))
                .andExpect(jsonPath("$.highlights", hasSize(5)));
    }

    @Test
    void resumeListsEveryRoleNewestFirst() throws Exception {
        // given the content API
        // when the resume is requested
        mvc.perform(get("/api/content/resume"))
                // then it lists the side projects first, then all 8 roles with the most recent first
                .andExpect(jsonPath("$", hasSize(9)))
                .andExpect(jsonPath("$[0].company").value("Side Projects"))
                .andExpect(jsonPath("$[0].dates").value("2023 – Present"))
                .andExpect(jsonPath("$[1].company").value("Fifth Third Bank"))
                .andExpect(jsonPath("$[1].contractVia").value("TEKsystems"))
                .andExpect(jsonPath("$[1].dates").value("2026"))
                .andExpect(jsonPath("$[1].highlights", hasSize(8)))
                .andExpect(jsonPath("$[2].company").value("Ameritas"))
                .andExpect(jsonPath("$[2].dates").value("2022 – 2025"))
                .andExpect(jsonPath("$[2].contractVia").doesNotExist())
                .andExpect(jsonPath("$[3].company").value("FIS"))
                .andExpect(jsonPath("$[8].company").value("GE"));
    }

    @Test
    void otherPagesHaveTheirEntries() throws Exception {
        // given the content API
        // when each list page is requested, then it has all its entries
        mvc.perform(get("/api/content/testimonials")).andExpect(jsonPath("$", hasSize(12)));
        mvc.perform(get("/api/content/education")).andExpect(jsonPath("$", hasSize(3)));
        mvc.perform(get("/api/content/charity"))
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[1].link.href").value("https://www.dogdaysrescue.org/"));
    }

    @Test
    void runningListsRaceResultsNewestFirst() throws Exception {
        // given the content API
        // when the running page is requested
        mvc.perform(get("/api/content/running"))
                // then it links the Athlinks profile and lists every race, the most recent first
                .andExpect(jsonPath("$.profile.href").value("https://www.athlinks.com/athletes/593706339"))
                .andExpect(jsonPath("$.races", hasSize(25)))
                .andExpect(jsonPath("$.races[0].event").value("Blue Ridge Turkey Trot"))
                .andExpect(jsonPath("$.races[0].date").value("2026-11-26"))
                .andExpect(jsonPath("$.races[0].place").value(305))
                .andExpect(jsonPath("$.races[0].finishers").value(875));
    }

    @Test
    void runningStatsTotalTheRacesAndListPersonalBests() throws Exception {
        // given the content API
        // when the running stats are requested
        mvc.perform(get("/api/content/running/stats"))
                // then they total all 25 races from 2009 to 2026
                .andExpect(jsonPath("$.races").value(25))
                .andExpect(jsonPath("$.firstYear").value(2009))
                .andExpect(jsonPath("$.lastYear").value(2026))
                .andExpect(jsonPath("$.totalMiles").value(217.7))
                .andExpect(jsonPath("$.totalTime").value("40:28:36"))
                // and list the fastest race at each of the 8 distances, shortest first
                .andExpect(jsonPath("$.personalBests", hasSize(8)))
                .andExpect(jsonPath("$.personalBests[0].distance").value("5K"))
                .andExpect(jsonPath("$.personalBests[0].time").value("28:12"))
                .andExpect(jsonPath("$.personalBests[0].event").value("Komen NC Triangle Race for the Cure"))
                .andExpect(jsonPath("$.personalBests[6].distance").value("Half marathon"))
                .andExpect(jsonPath("$.personalBests[6].time").value("2:13:07"));
    }

    @Tag("negative")
    @Test
    void runningStatsAreReadOnly() throws Exception {
        // given the content API
        // when the running stats are posted to or deleted, then the method is not allowed
        mvc.perform(post("/api/content/running/stats")).andExpect(status().isMethodNotAllowed());
        mvc.perform(delete("/api/content/running/stats")).andExpect(status().isMethodNotAllowed());
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

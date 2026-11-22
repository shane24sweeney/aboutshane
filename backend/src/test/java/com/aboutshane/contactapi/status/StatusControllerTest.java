package com.aboutshane.contactapi.status;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import com.aboutshane.contactapi.ApiExceptionHandler;
import com.aboutshane.contactapi.content.ContentRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(StatusController.class)
@Import({ContentRepository.class, ApiExceptionHandler.class})
class StatusControllerTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private QualityReport report;

    @Test
    void reportsWhatIsRunningAndTheLatestTestVerdict() throws Exception {
        // given the latest daily report passed
        when(report.latest()).thenReturn(Optional.of(new QualityReport.Verdict(
                "healthy", "Healthy", "All 973 checks passed", "Saturday, November 21, 2026", "https://shane24sweeney.github.io/aboutshane/")));
        // when the status is requested
        mvc.perform(get("/api/status"))
                // then it says the API is up, what it runs on, and how the tests went
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=60, public"))
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.runtime").value("Java " + Runtime.version().feature()))
                .andExpect(jsonPath("$.uptimeSeconds").isNumber())
                .andExpect(jsonPath("$.startedAt").isString())
                .andExpect(jsonPath("$.content.pages").value(7))
                .andExpect(jsonPath("$.content.races").isNumber())
                .andExpect(jsonPath("$.quality.status").value("healthy"))
                .andExpect(jsonPath("$.quality.headline").value("All 973 checks passed"));
    }

    @Tag("negative")
    @Test
    void stillAnswersWhenTheReportCannotBeRead() throws Exception {
        when(report.latest()).thenReturn(Optional.empty());
        mvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.quality").doesNotExist());
    }

    @Tag("negative")
    @Test
    void isReadOnly() throws Exception {
        mvc.perform(post("/api/status")).andExpect(status().isMethodNotAllowed());
    }
}

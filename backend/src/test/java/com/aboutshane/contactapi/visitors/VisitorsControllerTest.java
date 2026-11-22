package com.aboutshane.contactapi.visitors;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import com.aboutshane.contactapi.ApiExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(VisitorsController.class)
@Import(ApiExceptionHandler.class)
class VisitorsControllerTest {
    static final String EXPORT = """
            {"version":1,"generatedAt":"2026-11-21T11:40:00Z","days":30,
             "totals":{"users":619,"newUsers":513,"sessions":866,"pageViews":2228,"avgSessionSeconds":94},
             "usShare":0.67,"countries":[{"code":"US","name":"United States","users":412,"sessions":576}],
             "pages":[],"daily":[],"speed":{"realUsers":null,"api":null,"load":null}}
            """;

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private VisitorStats stats;

    @Test
    void servesTheLatestExportCacheableForTenMinutes() throws Exception {
        // given the daily export is available
        when(stats.latest()).thenReturn(Optional.of(new ObjectMapper().readTree(EXPORT)));
        // when the visitors are requested
        mvc.perform(get("/api/visitors"))
                // then the export comes back as it was published
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=600, public"))
                .andExpect(jsonPath("$.totals.users").value(619))
                .andExpect(jsonPath("$.usShare").value(0.67))
                .andExpect(jsonPath("$.countries[0].code").value("US"));
    }

    @Tag("negative")
    @Test
    void saysTheNumbersAreComingBeforeTheFirstExport() throws Exception {
        when(stats.latest()).thenReturn(Optional.empty());
        mvc.perform(get("/api/visitors"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=60, public"))
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.message").isString());
    }

    @Tag("negative")
    @Test
    void isReadOnly() throws Exception {
        mvc.perform(post("/api/visitors")).andExpect(status().isMethodNotAllowed());
    }
}

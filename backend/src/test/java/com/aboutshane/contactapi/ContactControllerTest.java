package com.aboutshane.contactapi;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ContactController.class)
class ContactControllerTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private ContactService contactService;

    private static String body(String name, String email, String message) {
        return """
                {"name": "%s", "email": "%s", "message": "%s", "website": ""}
                """.formatted(name, email, message);
    }

    @Test
    void healthReportsOkOnBothPaths() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
        mvc.perform(get("/health")).andExpect(status().isOk());
    }

    @Test
    void acceptsAValidMessage() throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "Hello")))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("received"));

        verify(contactService).submit(new ContactRequest("Jane Doe", "jane@example.com", "Hello", ""));
    }

    @ParameterizedTest(name = "rejects invalid {0}")
    @CsvSource({
        "name,    '',       jane@example.com, Hello",
        "email,   Jane Doe, not-an-email,     Hello",
        "email,   Jane Doe, '',               Hello",
        "message, Jane Doe, jane@example.com, ''",
    })
    void rejectsInvalidFields(String field, String name, String email, String message) throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(name, email, message)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fields." + field).exists());

        verify(contactService, never()).submit(any());
    }

    @Test
    void rejectsAMessageThatIsTooLong() throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "x".repeat(5001))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.message").exists());
    }

    @Test
    void rejectsMalformedJson() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("malformed_request"));
    }

    @Test
    void unknownPathsAndMethodsKeepTheirClientErrorStatus() throws Exception {
        mvc.perform(get("/api/nope")).andExpect(status().isNotFound());
        mvc.perform(get("/api/contact")).andExpect(status().isMethodNotAllowed());
    }

    @Test
    void hidesInternalErrors() throws Exception {
        doThrow(new IllegalStateException("table missing")).when(contactService).submit(any());

        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "Hello")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("internal_error"));
    }
}

package com.aboutshane.contactapi;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Tag;
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

    @Tag("negative")
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

    @Tag("negative")
    @Test
    void rejectsAMessageThatIsTooLong() throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "x".repeat(5001))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.message").exists());
    }

    @Tag("negative")
    @Test
    void rejectsMalformedJson() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("malformed_request"));
    }

    @Tag("negative")
    @Test
    void unknownPathsAndMethodsKeepTheirClientErrorStatus() throws Exception {
        mvc.perform(get("/api/nope")).andExpect(status().isNotFound());
        mvc.perform(get("/api/contact")).andExpect(status().isMethodNotAllowed());
    }

    @Tag("negative")
    @Test
    void hidesInternalErrors() throws Exception {
        doThrow(new IllegalStateException("table missing")).when(contactService).submit(any());

        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "Hello")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("internal_error"));
    }

    @Tag("negative")
    @ParameterizedTest(name = "rejects a blank {0}")
    @CsvSource({
        "name,    '   ',    jane@example.com, Hello",
        "message, Jane Doe, jane@example.com, '   '",
    })
    void rejectsBlankFields(String field, String name, String email, String message) throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(name, email, message)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields." + field).exists());

        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsFieldsOverTheirLengthLimits() throws Exception {
        String longEmail = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(63) + ".com";
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("x".repeat(101), longEmail, "Hello")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.email").exists());

        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsAnOversizedHoneypot() throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Jane Doe", "email": "jane@example.com", "message": "Hello", "website": "%s"}
                                """.formatted("x".repeat(201))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.website").exists());
    }

    @Tag("negative")
    @Test
    void rejectsAnEmptyObjectWithEveryMissingField() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.message").exists());

        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @ParameterizedTest(name = "rejects the body {0}")
    @CsvSource(delimiter = '|', value = {"''", "'[]'", "'\"just a string\"'", "'{\"name\": \"Jane\"'"})
    void rejectsBodiesThatAreNotAContactObject(String content) throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(content))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("malformed_request"));

        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsBodiesThatAreNotJson() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.TEXT_PLAIN).content("name=Jane"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.error").value("request_rejected"));

        verify(contactService, never()).submit(any());
    }
}

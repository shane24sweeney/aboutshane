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
        // given the contact API, with the service behind it mocked
        // when the health check is requested on /api/health and /health, then both report ok
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
        mvc.perform(get("/health")).andExpect(status().isOk());
    }

    @Test
    void acceptsAValidMessage() throws Exception {
        // given the contact API, with the service behind it mocked
        // when a valid message is posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "Hello")))
                // then it is accepted
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("received"));

        // and it is passed to the service as sent
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
        // given the contact API, with the service behind it mocked
        // when a message with one missing or invalid field is posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(name, email, message)))
                // then it is rejected with 400, naming that field
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fields." + field).exists());

        // and nothing reaches the service
        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsAMessageThatIsTooLong() throws Exception {
        // given the contact API, with the service behind it mocked
        // when a message over 5,000 characters is posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "x".repeat(5001))))
                // then it is rejected, naming the message field
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.message").exists());
    }

    @Tag("negative")
    @Test
    void rejectsMalformedJson() throws Exception {
        // given the contact API, with the service behind it mocked
        // when a body that is not valid JSON is posted
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                // then it is rejected as malformed
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("malformed_request"));
    }

    @Tag("negative")
    @Test
    void unknownPathsAndMethodsKeepTheirClientErrorStatus() throws Exception {
        // given the contact API, with the service behind it mocked
        // when an unknown path, or the contact API with GET, is requested, then they answer 404 and 405, not 500
        mvc.perform(get("/api/nope")).andExpect(status().isNotFound());
        mvc.perform(get("/api/contact")).andExpect(status().isMethodNotAllowed());
    }

    @Tag("negative")
    @Test
    void hidesInternalErrors() throws Exception {
        // given the service fails with an internal error
        doThrow(new IllegalStateException("table missing")).when(contactService).submit(any());

        // when a valid message is posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Jane Doe", "jane@example.com", "Hello")))
                // then the visitor gets a generic 500, with no internal details
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
        // given the contact API, with the service behind it mocked
        // when a name or message of only spaces is posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(name, email, message)))
                // then it is rejected, naming that field
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields." + field).exists());

        // and nothing reaches the service
        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsFieldsOverTheirLengthLimits() throws Exception {
        // given the contact API, with the service behind it mocked
        String longEmail = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(63) + ".com";
        // when a name over 100 characters and an email over 254 are posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("x".repeat(101), longEmail, "Hello")))
                // then both fields are rejected
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.email").exists());

        // and nothing reaches the service
        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsAnOversizedHoneypot() throws Exception {
        // given the contact API, with the service behind it mocked
        // when a honeypot value over 200 characters is posted
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Jane Doe", "email": "jane@example.com", "message": "Hello", "website": "%s"}
                                """.formatted("x".repeat(201))))
                // then it is rejected, naming the honeypot field
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.website").exists());
    }

    @Tag("negative")
    @Test
    void rejectsAnEmptyObjectWithEveryMissingField() throws Exception {
        // given the contact API, with the service behind it mocked
        // when an empty JSON object is posted
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{}"))
                // then it is rejected, naming every required field
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.message").exists());

        // and nothing reaches the service
        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @ParameterizedTest(name = "rejects the body {0}")
    @CsvSource(delimiter = '|', value = {"''", "'[]'", "'\"just a string\"'", "'{\"name\": \"Jane\"'"})
    void rejectsBodiesThatAreNotAContactObject(String content) throws Exception {
        // given the contact API, with the service behind it mocked
        // when an empty, array, string or cut-off body is posted
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(content))
                // then it is rejected as malformed
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("malformed_request"));

        // and nothing reaches the service
        verify(contactService, never()).submit(any());
    }

    @Tag("negative")
    @Test
    void rejectsBodiesThatAreNotJson() throws Exception {
        // given the contact API, with the service behind it mocked
        // when the message is posted as plain text
        mvc.perform(post("/api/contact").contentType(MediaType.TEXT_PLAIN).content("name=Jane"))
                // then it is rejected as an unsupported type (415)
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.error").value("request_rejected"));

        // and nothing reaches the service
        verify(contactService, never()).submit(any());
    }
}

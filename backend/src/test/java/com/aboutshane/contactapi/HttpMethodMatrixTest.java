package com.aboutshane.contactapi;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.sesv2.SesV2Client;

/**
 * The whole API is read-only apart from the contact form: every endpoint accepts only the methods
 * it is built for, and everything else (PUT, PATCH, DELETE, or POST on a read) is refused with 405
 * before any code runs, without storing or emailing anything and without leaking internals.
 */
@SpringBootTest(properties = {
    "app.contact.table-name=test-table",
    "app.contact.sender=noreply@test.example",
    "app.contact.recipient=owner@test.example",
})
@AutoConfigureMockMvc
@Tag("negative")
@Tag("security")
class HttpMethodMatrixTest {
    private static final List<String> READ_ONLY = List.of(
            "/api/health",
            "/api/content/profile", "/api/content/about", "/api/content/resume",
            "/api/content/testimonials", "/api/content/education", "/api/content/charity",
            "/api/content/running", "/api/content/running/stats",
            "/api/search?q=java", "/api/resume.pdf", "/api/status", "/api/visitors");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private DynamoDbClient dynamoDb;

    @MockitoBean
    private SesV2Client ses;

    static Stream<Arguments> refused() {
        Stream<Arguments> reads = READ_ONLY.stream().flatMap(path -> Stream.of(
                HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE)
                .map(method -> Arguments.of(method, path, "GET")));
        Stream<Arguments> contact = Stream.of(HttpMethod.GET, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE)
                .map(method -> Arguments.of(method, "/api/contact", "POST"));
        return Stream.concat(reads, contact);
    }

    @ParameterizedTest(name = "{0} {1} is refused")
    @MethodSource("refused")
    void everyOtherMethodIsRefused(HttpMethod method, String path, String allowed) throws Exception {
        // given the whole application, with DynamoDB and SES replaced by mocks
        // when the endpoint is called with a method it doesn't support, with a body as a write would have
        mvc.perform(request(method, path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Jane Doe", "email": "jane@example.com", "message": "Overwrite", "website": ""}
                                """))
                // then it is refused with 405, and the Allow header names only the supported method
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", containsString(allowed)))
                .andExpect(header().string("Allow", not(containsString("PUT"))))
                .andExpect(header().string("Allow", not(containsString("DELETE"))))
                // and the error gives nothing away
                .andExpect(content().string(not(containsString("Exception"))))
                .andExpect(content().string(not(containsString("springframework"))));

        // and nothing is stored or emailed
        verifyNoInteractions(dynamoDb, ses);
    }
}

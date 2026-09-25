package com.aboutshane.contactapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

/** Wires the whole application with only the AWS clients replaced. */
@SpringBootTest(properties = {
    "app.contact.table-name=test-table",
    "app.contact.sender=noreply@test.example",
    "app.contact.recipient=owner@test.example",
})
@AutoConfigureMockMvc
class ContactApiApplicationTest {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private DynamoDbClient dynamoDb;

    @MockitoBean
    private SesV2Client ses;

    @Test
    void aSubmittedMessageIsStoredAndEmailed() throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Jane Doe", "email": "jane@example.com", "message": "Hello", "website": ""}
                                """))
                .andExpect(status().isAccepted());

        ArgumentCaptor<PutItemRequest> put = ArgumentCaptor.forClass(PutItemRequest.class);
        verify(dynamoDb).putItem(put.capture());
        assertThat(put.getValue().tableName()).isEqualTo("test-table");

        ArgumentCaptor<SendEmailRequest> email = ArgumentCaptor.forClass(SendEmailRequest.class);
        verify(ses).sendEmail(email.capture());
        assertThat(email.getValue().fromEmailAddress()).isEqualTo("noreply@test.example");
        assertThat(email.getValue().destination().toAddresses()).containsExactly("owner@test.example");
    }

    @Test
    void theHoneypotKeepsBotsOutOfStorage() throws Exception {
        mvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Bot", "email": "bot@example.com", "message": "Spam", "website": "x"}
                                """))
                .andExpect(status().isAccepted());

        verifyNoInteractions(dynamoDb, ses);
    }
}

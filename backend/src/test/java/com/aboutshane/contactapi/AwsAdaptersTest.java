package com.aboutshane.contactapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

class AwsAdaptersTest {
    private static final ContactMessage MESSAGE = new ContactMessage(
            "id-123", Instant.parse("2026-09-25T12:00:00Z"), "Jane Doe", "jane@example.com", "Hello there");

    @Test
    void repositoryWritesTheMessageWithAnExpiry() {
        // given a repository backed by DynamoDB
        DynamoDbClient dynamoDb = mock(DynamoDbClient.class);
        DynamoDbContactRepository repository = new DynamoDbContactRepository(dynamoDb, "contact-table");

        // when a message is saved
        repository.save(MESSAGE);

        // then it is written once, with every field and an expiry date
        ArgumentCaptor<PutItemRequest> request = ArgumentCaptor.forClass(PutItemRequest.class);
        verify(dynamoDb).putItem(request.capture());
        assertThat(request.getValue().tableName()).isEqualTo("contact-table");
        assertThat(request.getValue().conditionExpression()).isEqualTo("attribute_not_exists(id)");
        var item = request.getValue().item();
        assertThat(item.get("id").s()).isEqualTo("id-123");
        assertThat(item.get("email").s()).isEqualTo("jane@example.com");
        assertThat(item.get("message").s()).isEqualTo("Hello there");
        assertThat(Long.parseLong(item.get("expiresAt").n()))
                .isEqualTo(MESSAGE.receivedAt().plus(DynamoDbContactRepository.RETENTION).getEpochSecond());
    }

    @Test
    void notifierEmailsTheOwnerWithReplyToTheVisitor() {
        // given a notifier that sends email through SES
        SesV2Client ses = mock(SesV2Client.class);
        SesContactNotifier notifier = new SesContactNotifier(ses, "noreply@selenium-automation.com", "owner@example.com");

        // when it is told about a message
        notifier.notify(MESSAGE);

        // then the owner gets an email they can reply to, straight to the visitor
        ArgumentCaptor<SendEmailRequest> request = ArgumentCaptor.forClass(SendEmailRequest.class);
        verify(ses).sendEmail(request.capture());
        SendEmailRequest email = request.getValue();
        assertThat(email.fromEmailAddress()).isEqualTo("noreply@selenium-automation.com");
        assertThat(email.destination().toAddresses()).containsExactly("owner@example.com");
        assertThat(email.replyToAddresses()).containsExactly("jane@example.com");
        assertThat(email.content().simple().subject().data()).isEqualTo("Website message from Jane Doe");
        assertThat(email.content().simple().body().text().data()).contains("Hello there", "id-123");
    }
}

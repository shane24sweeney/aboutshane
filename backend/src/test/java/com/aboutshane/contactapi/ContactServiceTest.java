package com.aboutshane.contactapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

class ContactServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-25T12:00:00Z");

    private final ContactRepository repository = mock(ContactRepository.class);
    private final ContactNotifier notifier = mock(ContactNotifier.class);
    private final ContactService service =
            new ContactService(repository, notifier, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void storesThenNotifies() {
        // given a message with stray whitespace and an empty honeypot
        ContactRequest request = new ContactRequest("  Jane Doe ", " jane@example.com", " Hello\n", "");

        // when it is submitted
        service.submit(request);

        // then it is saved, then the owner is notified, with the whitespace trimmed
        InOrder order = inOrder(repository, notifier);
        ArgumentCaptor<ContactMessage> saved = ArgumentCaptor.forClass(ContactMessage.class);
        order.verify(repository).save(saved.capture());
        order.verify(notifier).notify(saved.getValue());

        ContactMessage message = saved.getValue();
        assertThat(message.id()).isNotBlank();
        assertThat(message.receivedAt()).isEqualTo(NOW);
        assertThat(message.name()).isEqualTo("Jane Doe");
        assertThat(message.email()).isEqualTo("jane@example.com");
        assertThat(message.message()).isEqualTo("Hello");
    }

    @Tag("negative")
    @Test
    void dropsHoneypotSubmissionsSilently() {
        // given a submission with the hidden honeypot field filled in, as bots do
        ContactRequest request = new ContactRequest("Bot", "bot@example.com", "Buy now", "https://spam.example");

        // when it is submitted
        service.submit(request);

        // then nothing is stored and nobody is emailed
        verifyNoInteractions(repository, notifier);
    }

    @Tag("negative")
    @Test
    void aFailedNotificationDoesNotLoseTheMessage() {
        // given the email service is down
        doThrow(new RuntimeException("SES unavailable")).when(notifier).notify(any());

        // when a message is submitted, then it succeeds and the message is still saved
        assertThatCode(() -> service.submit(new ContactRequest("Jane", "jane@example.com", "Hi", null)))
                .doesNotThrowAnyException();
        verify(repository).save(any());
    }

    @Tag("negative")
    @Test
    void aFailedSaveIsReported() {
        // given the database is down
        doThrow(new RuntimeException("DynamoDB unavailable")).when(repository).save(any());

        // when a message is submitted, then the failure is reported and nobody is emailed
        assertThatThrownBy(() -> service.submit(new ContactRequest("Jane", "jane@example.com", "Hi", null)))
                .hasMessage("DynamoDB unavailable");
        verifyNoInteractions(notifier);
    }
}

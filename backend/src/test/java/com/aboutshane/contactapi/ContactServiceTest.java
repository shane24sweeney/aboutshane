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
        service.submit(new ContactRequest("  Jane Doe ", " jane@example.com", " Hello\n", ""));

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

    @Test
    void dropsHoneypotSubmissionsSilently() {
        service.submit(new ContactRequest("Bot", "bot@example.com", "Buy now", "https://spam.example"));

        verifyNoInteractions(repository, notifier);
    }

    @Test
    void aFailedNotificationDoesNotLoseTheMessage() {
        doThrow(new RuntimeException("SES unavailable")).when(notifier).notify(any());

        assertThatCode(() -> service.submit(new ContactRequest("Jane", "jane@example.com", "Hi", null)))
                .doesNotThrowAnyException();
        verify(repository).save(any());
    }

    @Test
    void aFailedSaveIsReported() {
        doThrow(new RuntimeException("DynamoDB unavailable")).when(repository).save(any());

        assertThatThrownBy(() -> service.submit(new ContactRequest("Jane", "jane@example.com", "Hi", null)))
                .hasMessage("DynamoDB unavailable");
        verifyNoInteractions(notifier);
    }
}

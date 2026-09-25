package com.aboutshane.contactapi;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ContactService {
    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactRepository repository;
    private final ContactNotifier notifier;
    private final Clock clock;

    public ContactService(ContactRepository repository, ContactNotifier notifier, Clock clock) {
        this.repository = repository;
        this.notifier = notifier;
        this.clock = clock;
    }

    /**
     * Stores the message, then emails a notification. A failed notification is logged rather than
     * returned as an error, because the stored message is not lost.
     */
    public void submit(ContactRequest request) {
        if (request.isLikelySpam()) {
            // Answer like a normal submission so bots get no signal.
            log.info("Dropped contact submission that filled in the honeypot field");
            return;
        }

        ContactMessage message = ContactMessage.from(request, clock.instant());
        repository.save(message);
        log.info("Stored contact message {}", message.id());

        try {
            notifier.notify(message);
        } catch (RuntimeException exception) {
            log.error("Stored contact message {} but the email notification failed", message.id(), exception);
        }
    }
}

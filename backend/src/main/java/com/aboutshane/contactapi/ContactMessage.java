package com.aboutshane.contactapi;

import java.time.Instant;
import java.util.UUID;

/** A contact message accepted for storage and notification. */
public record ContactMessage(String id, Instant receivedAt, String name, String email, String message) {

    static ContactMessage from(ContactRequest request, Instant receivedAt) {
        return new ContactMessage(
                UUID.randomUUID().toString(),
                receivedAt,
                request.name().strip(),
                request.email().strip(),
                request.message().strip());
    }
}

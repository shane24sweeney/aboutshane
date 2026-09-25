package com.aboutshane.contactapi;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.Body;
import software.amazon.awssdk.services.sesv2.model.Content;
import software.amazon.awssdk.services.sesv2.model.Destination;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.Message;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

@Component
public class SesContactNotifier implements ContactNotifier {
    private final SesV2Client ses;
    private final String sender;
    private final String recipient;

    public SesContactNotifier(
            SesV2Client ses,
            @Value("${app.contact.sender}") String sender,
            @Value("${app.contact.recipient}") String recipient) {
        this.ses = ses;
        this.sender = sender;
        this.recipient = recipient;
    }

    @Override
    public void notify(ContactMessage message) {
        String subject = "Website message from " + message.name();
        String body = """
                New message from the contact form on selenium-automation.com

                Name:  %s
                Email: %s
                Received: %s
                Reference: %s

                %s
                """.formatted(message.name(), message.email(), message.receivedAt(), message.id(), message.message());

        ses.sendEmail(SendEmailRequest.builder()
                .fromEmailAddress(sender)
                .destination(Destination.builder().toAddresses(recipient).build())
                // Replying goes straight to the visitor.
                .replyToAddresses(message.email())
                .content(EmailContent.builder()
                        .simple(Message.builder()
                                .subject(text(subject))
                                .body(Body.builder().text(text(body)).build())
                                .build())
                        .build())
                .build());
    }

    private static Content text(String value) {
        return Content.builder().data(value).charset("UTF-8").build();
    }
}

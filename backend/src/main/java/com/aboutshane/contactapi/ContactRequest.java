package com.aboutshane.contactapi;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A message submitted from the contact form.
 *
 * @param website honeypot field; hidden from people, so a value means a bot filled in the form
 */
public record ContactRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 5000) String message,
        @Size(max = 200) String website) {

    boolean isLikelySpam() {
        return website != null && !website.isBlank();
    }
}

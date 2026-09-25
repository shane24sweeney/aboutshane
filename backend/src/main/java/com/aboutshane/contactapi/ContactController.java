package com.aboutshane.contactapi;

import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ContactController {
    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    /** CloudFront forwards /api/* here; /health stays for direct API Gateway checks. */
    @GetMapping({"/api/health", "/health"})
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/api/contact")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> contact(@Valid @RequestBody ContactRequest request) {
        contactService.submit(request);
        return Map.of("status", "received");
    }
}

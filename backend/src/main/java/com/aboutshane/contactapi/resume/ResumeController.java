package com.aboutshane.contactapi.resume;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/resume.pdf: the résumé to download, built from the Resume page's content. */
@RestController
public class ResumeController {
    static final String FILE_NAME = "Shane-James-Sweeney-Resume.pdf";

    private final ResumePdf pdf;

    public ResumeController(ResumePdf pdf) {
        this.pdf = pdf;
    }

    @GetMapping("/api/resume.pdf")
    public ResponseEntity<byte[]> resume() {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(FILE_NAME).build().toString())
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .body(pdf.bytes());
    }
}

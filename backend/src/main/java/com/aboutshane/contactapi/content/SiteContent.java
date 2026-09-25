package com.aboutshane.contactapi.content;

import java.util.List;

/**
 * Page content served by {@link ContentController}. The shapes mirror the JSON files in the
 * repository's top-level content/ folder, which the frontend also bundles as a fallback.
 * Image fields are keys the frontend maps to its bundled images.
 */
public final class SiteContent {
    private SiteContent() {}

    public record Profile(
            String name,
            String headline,
            String meta,
            String summaryTitle,
            /** Paragraphs; **double asterisks** mark bold phrases. */
            List<String> summary,
            String strengthsTitle,
            List<String> strengths,
            String highlightsTitle,
            String frameworks,
            List<Highlight> highlights) {}

    public record Highlight(String label, String text) {}

    public record About(String essay, String signature) {}

    public record ResumeEntry(
            String role,
            String company,
            String contractVia,
            String dates,
            String logo,
            String meta,
            String summary,
            List<String> highlights) {}

    public record Testimonial(String name, String title, String photo, String recommendation) {}

    public record Degree(String degree, String school, String logo) {}

    public record CharityEvent(String title, String image, String alt, Link link) {}

    public record Link(String href, String label) {}
}

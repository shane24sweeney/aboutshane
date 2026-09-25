package com.aboutshane.contactapi.content;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;

import com.aboutshane.contactapi.content.SiteContent.About;
import com.aboutshane.contactapi.content.SiteContent.CharityEvent;
import com.aboutshane.contactapi.content.SiteContent.Degree;
import com.aboutshane.contactapi.content.SiteContent.Profile;
import com.aboutshane.contactapi.content.SiteContent.ResumeEntry;
import com.aboutshane.contactapi.content.SiteContent.Testimonial;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

/**
 * Loads page content from classpath:content/*.json once, at startup. Unknown fields fail fast so
 * a content change that doesn't match the API contract breaks the build, not a page view.
 */
@Repository
public class ContentRepository {
    private final Profile profile;
    private final About about;
    private final List<ResumeEntry> resume;
    private final List<Testimonial> testimonials;
    private final List<Degree> education;
    private final List<CharityEvent> charity;

    public ContentRepository(ObjectMapper objectMapper) {
        ObjectMapper strict = objectMapper.copy().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        profile = read(strict, "profile", new TypeReference<>() {});
        about = read(strict, "about", new TypeReference<>() {});
        resume = List.copyOf(read(strict, "resume", new TypeReference<List<ResumeEntry>>() {}));
        testimonials = List.copyOf(read(strict, "testimonials", new TypeReference<List<Testimonial>>() {}));
        education = List.copyOf(read(strict, "education", new TypeReference<List<Degree>>() {}));
        charity = List.copyOf(read(strict, "charity", new TypeReference<List<CharityEvent>>() {}));
    }

    private static <T> T read(ObjectMapper mapper, String name, TypeReference<T> type) {
        try (InputStream in = new ClassPathResource("content/" + name + ".json").getInputStream()) {
            return mapper.readValue(in, type);
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not load content/" + name + ".json", exception);
        }
    }

    public Profile profile() {
        return profile;
    }

    public About about() {
        return about;
    }

    public List<ResumeEntry> resume() {
        return resume;
    }

    public List<Testimonial> testimonials() {
        return testimonials;
    }

    public List<Degree> education() {
        return education;
    }

    public List<CharityEvent> charity() {
        return charity;
    }
}

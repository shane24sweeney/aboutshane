package com.aboutshane.contactapi.content;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Guards the content files themselves: complete, no blanks, no PDF paste artifacts. */
class ContentRepositoryTest {
    private final ContentRepository content = new ContentRepository(new ObjectMapper());

    @Test
    void everyResumeEntryIsComplete() {
        assertThat(content.resume()).allSatisfy(entry -> {
            assertThat(entry.role()).isNotBlank();
            assertThat(entry.company()).isNotBlank();
            assertThat(entry.dates()).matches("(19|20)\\d{2}( – ((19|20)\\d{2}|Present))?");
            assertThat(entry.logo()).isNotBlank();
            assertThat(entry.highlights()).isNotNull().allSatisfy(line -> assertThat(line).isNotBlank());
        });
    }

    @Test
    void everyTestimonialHasANameTitleAndQuote() {
        assertThat(content.testimonials()).allSatisfy(testimonial -> {
            assertThat(testimonial.name()).isNotBlank();
            assertThat(testimonial.title()).isNotBlank();
            assertThat(testimonial.recommendation()).isNotBlank();
        });
    }

    @Test
    void everyImageHasAltText() {
        assertThat(content.charity()).allSatisfy(event -> assertThat(event.alt()).isNotBlank());
        assertThat(content.education()).allSatisfy(degree -> assertThat(degree.school()).isNotBlank());
    }

    @Test
    void contentHasNoCopyPasteArtifacts() throws Exception {
        String all = new ObjectMapper().writeValueAsString(new Object[] {
            content.profile(), content.about(), content.resume(), content.testimonials(), content.education(), content.charity(),
        });
        assertThat(all).doesNotContain("tesDng", "SoMware", "ﬀ", "ﬁ", "ﬂ", "•");
    }
}

package com.aboutshane.contactapi.content;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Guards the content files themselves: complete, no blanks, no PDF paste artifacts. */
class ContentRepositoryTest {
    private final ContentRepository content = new ContentRepository(new ObjectMapper());

    @Test
    void everyResumeEntryIsComplete() {
        // given the content files, loaded as the API serves them
        // when the resume is read, then every role has a title, company, dates, logo and highlights
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
        // given the content files
        // when the testimonials are read, then each has a name, title and quote
        assertThat(content.testimonials()).allSatisfy(testimonial -> {
            assertThat(testimonial.name()).isNotBlank();
            assertThat(testimonial.title()).isNotBlank();
            assertThat(testimonial.recommendation()).isNotBlank();
        });
    }

    @Test
    void everyImageHasAltText() {
        // given the content files
        // when the charity and education pages are read, then every image has text describing it
        assertThat(content.charity()).allSatisfy(event -> assertThat(event.alt()).isNotBlank());
        assertThat(content.education()).allSatisfy(degree -> assertThat(degree.school()).isNotBlank());
    }

    @Test
    void contentHasNoCopyPasteArtifacts() throws Exception {
        // given every content page
        // when it is written out as text
        String all = new ObjectMapper().writeValueAsString(new Object[] {
            content.profile(), content.about(), content.resume(), content.testimonials(), content.education(), content.charity(),
        });
        // then none of the broken characters a PDF copy leaves behind appear
        assertThat(all).doesNotContain("tesDng", "SoMware", "ﬀ", "ﬁ", "ﬂ", "•");
    }
}

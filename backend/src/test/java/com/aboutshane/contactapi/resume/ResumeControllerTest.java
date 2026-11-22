package com.aboutshane.contactapi.resume;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aboutshane.contactapi.ApiExceptionHandler;
import com.aboutshane.contactapi.content.ContentRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ResumeController.class)
@Import({ContentRepository.class, ResumePdf.class, ApiExceptionHandler.class})
class ResumeControllerTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private ContentRepository content;

    @Test
    void servesTheResumeAsADownloadablePdf() throws Exception {
        // when the résumé is requested
        byte[] body = mvc.perform(get("/api/resume.pdf"))
                // then it is a PDF to save, cacheable for an hour
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"Shane-James-Sweeney-Resume.pdf\""))
                .andExpect(header().string("Cache-Control", "max-age=3600, public"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(body, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    void containsEveryRoleFromTheResumePage() throws Exception {
        byte[] body = mvc.perform(get("/api/resume.pdf")).andReturn().getResponse().getContentAsByteArray();
        try (PDDocument pdf = Loader.loadPDF(body)) {
            String text = new PDFTextStripper().getText(pdf).replaceAll("\\s+", " ");
            assertThat(pdf.getDocumentInformation().getTitle()).startsWith(content.profile().name());
            assertThat(text).contains(content.profile().name(), content.profile().headline(), "Professional Experience");
            for (var entry : content.resume()) {
                assertThat(text).contains(entry.company());
                assertThat(text).contains(entry.highlights().getFirst().split(" ")[0]);
            }
            assertThat(pdf.getNumberOfPages()).isBetween(1, 6);
        }
    }

    @Test
    void replacesCharactersThePdfFontLacks() {
        assertThat(ResumePdf.encodable("Résumé – “quoted” · ok")).isEqualTo("Résumé – “quoted” · ok");
        assertThat(ResumePdf.encodable("emoji 🚀 and ｆｕｌｌ")).doesNotContain("🚀").contains("full");
    }

    @Tag("negative")
    @Test
    void isReadOnly() throws Exception {
        mvc.perform(post("/api/resume.pdf")).andExpect(status().isMethodNotAllowed());
    }
}

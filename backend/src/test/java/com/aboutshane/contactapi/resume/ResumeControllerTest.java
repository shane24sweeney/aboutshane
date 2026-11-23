package com.aboutshane.contactapi.resume;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import com.aboutshane.contactapi.ApiExceptionHandler;
import com.aboutshane.contactapi.content.ContentRepository;
import com.aboutshane.contactapi.status.QualityReport;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ResumeController.class)
@Import({ContentRepository.class, LiveResume.class, ResumePdf.class, ApiExceptionHandler.class})
class ResumeControllerTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private ContentRepository content;

    @MockitoBean
    private QualityReport report;

    private String text(byte[] body) throws Exception {
        try (PDDocument pdf = Loader.loadPDF(body)) {
            return new PDFTextStripper().getText(pdf).replaceAll("\\s+", " ");
        }
    }

    @Test
    void quotesTheLatestQualityReportNumbersAndRebuildsOnlyWhenTheyChange() throws Exception {
        // given the PDF as written, then a daily quality report arrives
        String written = text(mvc.perform(get("/api/resume.pdf")).andReturn().getResponse().getContentAsByteArray());
        assertThat(written).doesNotContain("3,151 checks");
        when(report.metrics()).thenReturn(Optional.of(LiveResumeTest.sample()));
        // when the résumé is downloaded
        byte[] first = mvc.perform(get("/api/resume.pdf")).andReturn().getResponse().getContentAsByteArray();
        byte[] second = mvc.perform(get("/api/resume.pdf")).andReturn().getResponse().getContentAsByteArray();
        // then it quotes the report's numbers, and the same numbers give the same PDF
        assertThat(text(first)).contains("3,151 checks with 99.9% passing", "124 Vitest unit tests");
        assertThat(second).isEqualTo(first);
    }

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
            assertThat(text).contains(content.profile().name(), content.profile().headline(), content.profile().openTo(), "Professional Experience");
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

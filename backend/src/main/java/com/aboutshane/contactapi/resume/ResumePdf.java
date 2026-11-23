package com.aboutshane.contactapi.resume;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;

import com.aboutshane.contactapi.content.ContentRepository;
import com.aboutshane.contactapi.content.SiteContent.Profile;
import com.aboutshane.contactapi.content.SiteContent.ResumeEntry;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

/**
 * The résumé as a PDF, built from the same content as the Resume page, so the two never disagree.
 * It's built at startup and again only when the Side Projects numbers from the daily quality report
 * change, with PDF's built-in Helvetica, so no font files are bundled.
 */
@Component
public class ResumePdf {
    private static final float MARGIN = 54;
    private static final float WIDTH = PDRectangle.LETTER.getWidth() - 2 * MARGIN;
    private static final PDType1Font REGULAR = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDType1Font BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final float[] TEAL = {0.10f, 0.45f, 0.40f};
    private static final float[] GREY = {0.35f, 0.35f, 0.38f};
    private static final float[] INK = {0.10f, 0.10f, 0.12f};

    private final Profile profile;
    private final LiveResume live;
    private List<ResumeEntry> renderedFrom;
    private byte[] bytes;

    public ResumePdf(ContentRepository content, LiveResume live) {
        this.profile = content.profile();
        this.live = live;
        this.renderedFrom = content.resume();
        this.bytes = render(profile, renderedFrom);
    }

    public synchronized byte[] bytes() {
        List<ResumeEntry> resume = live.entries();
        if (!resume.equals(renderedFrom)) {
            bytes = render(profile, resume);
            renderedFrom = resume;
        }
        return bytes.clone();
    }

    static byte[] render(Profile profile, List<ResumeEntry> resume) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDDocumentInformation info = document.getDocumentInformation();
            info.setTitle(profile.name() + " - Résumé");
            info.setAuthor(profile.name());
            info.setSubject(profile.headline());
            try (Writer writer = new Writer(document)) {
                writer.line(profile.name(), BOLD, 22, INK, 6);
                writer.line(profile.headline(), BOLD, 12, TEAL, 2);
                writer.line(profile.meta() + "  ·  selenium-automation.com", REGULAR, 10, GREY, 14);
                writer.rule();

                writer.line(profile.summaryTitle(), BOLD, 13, TEAL, 6);
                for (String paragraph : profile.summary()) writer.paragraph(plain(paragraph), REGULAR, 10, INK, 6);
                writer.space(6);

                writer.line(profile.strengthsTitle(), BOLD, 13, TEAL, 6);
                writer.paragraph(String.join("  ·  ", profile.strengths()), REGULAR, 10, INK, 12);

                writer.line("Professional Experience", BOLD, 13, TEAL, 8);
                for (ResumeEntry entry : resume) {
                    String title = entry.role() + " - " + entry.company()
                            + (entry.contractVia() == null ? "" : " (Contract via " + entry.contractVia() + ")");
                    writer.keepTogether(60);
                    writer.paragraph(title, BOLD, 11, INK, 1);
                    if (entry.dates() != null) writer.line(entry.dates(), REGULAR, 9.5f, GREY, 4);
                    if (entry.summary() != null) writer.paragraph(entry.summary(), REGULAR, 10, INK, 3);
                    for (String highlight : entry.highlights()) writer.bullet(highlight);
                    writer.space(8);
                }
            }
            document.save(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not build the résumé PDF", exception);
        }
    }

    private static String plain(String text) {
        return text.replace("**", "");
    }

    /**
     * Helvetica only has the Windows-1252 characters; anything else (rare in this content) becomes
     * its closest plain form so the PDF never fails to build.
     */
    static String encodable(String text) {
        StringBuilder out = new StringBuilder(text.length());
        for (char c : text.toCharArray()) {
            try {
                REGULAR.encode(String.valueOf(c));
                out.append(c);
            } catch (IOException | IllegalArgumentException unsupported) {
                String folded = java.text.Normalizer.normalize(String.valueOf(c), java.text.Normalizer.Form.NFKD).replaceAll("\\p{M}", "");
                out.append(folded.chars().allMatch(ch -> ch < 128) && !folded.isEmpty() ? folded : "?");
            }
        }
        return out.toString();
    }

    /** Writes lines top to bottom, wrapping text and starting new pages as needed. */
    private static final class Writer implements AutoCloseable {
        private final PDDocument document;
        private PDPageContentStream stream;
        private float y;

        Writer(PDDocument document) throws IOException {
            this.document = document;
            newPage();
        }

        private void newPage() throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }

        void keepTogether(float height) throws IOException {
            if (y - height < MARGIN) newPage();
        }

        void space(float points) {
            y -= points;
        }

        void rule() throws IOException {
            stream.setStrokingColor(0.8f, 0.82f, 0.84f);
            stream.setLineWidth(0.75f);
            stream.moveTo(MARGIN, y);
            stream.lineTo(MARGIN + WIDTH, y);
            stream.stroke();
            y -= 14;
        }

        void line(String text, PDType1Font font, float size, float[] colour, float after) throws IOException {
            write(MARGIN, encodable(text), font, size, colour);
            y -= after;
        }

        void paragraph(String text, PDType1Font font, float size, float[] colour, float after) throws IOException {
            for (String line : wrap(encodable(text), font, size, WIDTH)) write(MARGIN, line, font, size, colour);
            y -= after;
        }

        void bullet(String text) throws IOException {
            List<String> lines = wrap(encodable(text), REGULAR, 10, WIDTH - 14);
            keepTogether(lines.size() * 13f);
            write(MARGIN + 2, "•", REGULAR, 10, TEAL, false);
            for (String line : lines) write(MARGIN + 14, line, REGULAR, 10, INK);
            y -= 2;
        }

        private void write(float x, String text, PDType1Font font, float size, float[] colour) throws IOException {
            write(x, text, font, size, colour, true);
        }

        private void write(float x, String text, PDType1Font font, float size, float[] colour, boolean advance) throws IOException {
            float leading = size * 1.3f;
            if (y - leading < MARGIN) newPage();
            stream.beginText();
            stream.setFont(font, size);
            stream.setNonStrokingColor(colour[0], colour[1], colour[2]);
            stream.newLineAtOffset(x, y - size);
            stream.showText(text);
            stream.endText();
            if (advance) y -= leading;
        }

        private static List<String> wrap(String text, PDType1Font font, float size, float width) throws IOException {
            List<String> lines = new ArrayList<>();
            StringBuilder line = new StringBuilder();
            for (String word : text.split("\\s+")) {
                String candidate = line.isEmpty() ? word : line + " " + word;
                if (font.getStringWidth(candidate) / 1000 * size > width && !line.isEmpty()) {
                    lines.add(line.toString());
                    line = new StringBuilder(word);
                } else {
                    line = new StringBuilder(candidate);
                }
            }
            if (!line.isEmpty()) lines.add(line.toString());
            return lines;
        }

        @Override
        public void close() throws IOException {
            stream.close();
        }
    }
}

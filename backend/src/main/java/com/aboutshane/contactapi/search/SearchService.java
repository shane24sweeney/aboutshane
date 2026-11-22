package com.aboutshane.contactapi.search;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import com.aboutshane.contactapi.content.ContentRepository;
import com.aboutshane.contactapi.content.SiteContent.RaceResult;
import com.aboutshane.contactapi.content.SiteContent.ResumeEntry;
import org.springframework.stereotype.Service;

/**
 * Searches every page's text. The content is fixed for the life of the Lambda, so it is broken into
 * small documents once, at startup. A result needs every word of the query (case and accents don't
 * matter). Results come page by page in the order a visitor would look (Home, Resume, About, then
 * the rest), and within a page those with the words in their title, or nearer the start, come first.
 */
@Service
public class SearchService {
    public static final int MIN_LENGTH = 2;
    public static final int MAX_LENGTH = 100;
    public static final int MAX_RESULTS = 20;
    private static final int SNIPPET = 160;
    private static final Pattern MARKUP = Pattern.compile("\\*\\*");
    private static final Pattern WORDS = Pattern.compile("[\\s,;:.!?()\"']+");

    /** One searchable piece of a page: where it lives, what to call it, and its text. */
    record Document(String page, String path, String title, String text, String folded) {}

    /** A match: the page it's on, a title, and a snippet of text around the first matched word. */
    public record Result(String page, String path, String title, String snippet, List<Highlight> highlights) {}

    /** Where a matched word sits in the snippet, so the page can mark it without trusting HTML. */
    public record Highlight(int start, int length) {}

    private static final List<String> PAGE_ORDER =
            List.of("/home", "/resume", "/about", "/running", "/education", "/charity", "/testimonials");

    private final List<Document> documents;

    public SearchService(ContentRepository content) {
        List<Document> docs = new ArrayList<>();
        var profile = content.profile();
        profile.summary().forEach(p -> add(docs, "Home", "/home", profile.summaryTitle(), p));
        profile.strengths().forEach(s -> add(docs, "Home", "/home", profile.strengthsTitle(), s));
        profile.highlights().forEach(h -> add(docs, "Home", "/home", h.label(), h.text()));
        add(docs, "Home", "/home", profile.highlightsTitle(), profile.frameworks());
        for (String paragraph : content.about().essay().split("\\n\\s*\\n")) add(docs, "About", "/about", "About Shane", paragraph);
        for (ResumeEntry entry : content.resume()) {
            String title = entry.role() + " - " + entry.company();
            add(docs, "Resume", "/resume", title, String.join(" ", nonNull(entry.dates()), nonNull(entry.summary())));
            entry.highlights().forEach(h -> add(docs, "Resume", "/resume", title, h));
        }
        content.testimonials().forEach(t -> add(docs, "Testimonials", "/testimonials", t.name() + ", " + t.title(), t.recommendation()));
        content.education().forEach(d -> add(docs, "Education", "/education", d.degree(), d.school()));
        content.charity().forEach(c -> add(docs, "Giving back", "/charity", c.title(), c.title()));
        add(docs, "Running", "/running", "Running", content.running().intro());
        for (RaceResult race : content.running().races()) {
            add(docs, "Running", "/running", race.event(),
                    "%s, %s. %s in %s (%s /mi), %d of %d overall."
                            .formatted(race.date(), race.location(), race.distance(), race.time(), race.pace(), race.place(), race.finishers()));
        }
        documents = List.copyOf(docs);
    }

    private static String nonNull(String value) {
        return value == null ? "" : value;
    }

    private static void add(List<Document> docs, String page, String path, String title, String text) {
        String plain = MARKUP.matcher(text).replaceAll("").strip();
        if (plain.isEmpty()) return;
        docs.add(new Document(page, path, title, plain, fold(title + " " + plain)));
    }

    /** Lower case without accents, so "resume" finds "Résumé". */
    static String fold(String text) {
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    /** The words of a query, folded; validated by the controller first. */
    static List<String> terms(String query) {
        return WORDS.splitAsStream(fold(query.strip())).filter(w -> !w.isBlank()).distinct().toList();
    }

    public List<Result> search(String query) {
        List<String> terms = terms(query);
        if (terms.isEmpty()) return List.of();
        record Scored(Document doc, int score) {}
        return documents.stream()
                .filter(doc -> terms.stream().allMatch(doc.folded()::contains))
                .map(doc -> new Scored(doc, score(doc, terms)))
                .sorted(Comparator.comparingInt((Scored s) -> PAGE_ORDER.indexOf(s.doc().path())).thenComparingInt(Scored::score))
                .limit(MAX_RESULTS)
                .map(s -> toResult(s.doc(), terms))
                .toList();
    }

    /** Lower is better: words in the title first, then words earlier in the text. */
    private static int score(Document doc, List<String> terms) {
        String title = fold(doc.title());
        int score = 0;
        for (String term : terms) {
            score += title.contains(term) ? 0 : 1000 + Math.max(0, doc.folded().indexOf(term) - title.length());
        }
        return score;
    }

    private static Result toResult(Document doc, List<String> terms) {
        String folded = fold(doc.text());
        int first = terms.stream().mapToInt(folded::indexOf).filter(i -> i >= 0).min().orElse(0);
        int start = Math.max(0, first - SNIPPET / 3);
        // Start and end on word boundaries so the snippet doesn't begin mid-word.
        if (start > 0) {
            int space = doc.text().indexOf(' ', start);
            start = space < 0 || space > first ? start : space + 1;
        }
        int end = Math.min(doc.text().length(), start + SNIPPET);
        if (end < doc.text().length()) {
            int space = doc.text().lastIndexOf(' ', end);
            end = space > start ? space : end;
        }
        String snippet = (start > 0 ? "…" : "") + doc.text().substring(start, end) + (end < doc.text().length() ? "…" : "");
        String foldedSnippet = fold(snippet);
        List<Highlight> highlights = new ArrayList<>();
        for (String term : terms) {
            for (int at = foldedSnippet.indexOf(term); at >= 0; at = foldedSnippet.indexOf(term, at + term.length())) {
                highlights.add(new Highlight(at, term.length()));
            }
        }
        highlights.sort(Comparator.comparingInt(Highlight::start));
        return new Result(doc.page(), doc.path(), doc.title(), snippet, List.copyOf(highlights));
    }
}

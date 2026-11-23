package com.aboutshane.contactapi.resume;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.OptionalLong;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import com.aboutshane.contactapi.content.ContentRepository;
import com.aboutshane.contactapi.content.SiteContent.ResumeEntry;
import com.aboutshane.contactapi.status.QualityReport;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

/**
 * The résumé with the Side Projects numbers (test counts, checks, pass rate, coverage, response
 * time) taken from the latest daily quality report, the same metrics.json the Quality dashboard
 * shows. Only those numbers change: the rest of the text is content/resume.json as written, and
 * any number the report doesn't have keeps the value written there.
 */
@Component
public class LiveResume {
    static final String SIDE_PROJECTS = "Side Projects";

    /** A number in the résumé text and how to read it from metrics.json. */
    record Rule(Pattern pattern, Function<JsonNode, Optional<String>> replacement) {}

    static final List<Rule> RULES = List.of(
            rule("\\d[\\d,]* JUnit/MockMvc backend tests",
                    m -> count(m, "/development/api/total").map(n -> n + " JUnit/MockMvc backend tests")),
            rule("\\d[\\d,]* Vitest unit tests",
                    m -> count(m, "/development/ui/total").map(n -> n + " Vitest unit tests")),
            rule("on \\d+ browser and device configurations",
                    m -> count(m, "/qa/regression/devices").map(n -> "on " + n + " browser and device configurations")),
            rule("\\d[\\d,]*\\+ runs per pull request",
                    m -> whole(m, "/qa/regression/total").stream().filter(n -> n >= 100).boxed().findFirst()
                            .map(n -> grouped(n / 100 * 100) + "+ runs per pull request")),
            rule("plus \\d[\\d,]* live production checks",
                    m -> count(m, "/qa/smoke/total").map(n -> "plus " + n + " live production checks")),
            rule("the latest daily run made \\d[\\d,]* checks with [\\d.]+% passing", LiveResume::checks),
            rule("\\d+% of the code is covered", LiveResume::coverage),
            rule("typical response under load is \\d+ ms",
                    m -> count(m, "/qa/load/median").map(n -> "typical response under load is " + n + " ms")));

    private final ContentRepository content;
    private final QualityReport report;

    public LiveResume(ContentRepository content, QualityReport report) {
        this.content = content;
        this.report = report;
    }

    /** The résumé entries, with the latest numbers when the report can be read. */
    public List<ResumeEntry> entries() {
        return report.metrics().map(metrics -> withMetrics(content.resume(), metrics)).orElseGet(content::resume);
    }

    static List<ResumeEntry> withMetrics(List<ResumeEntry> resume, JsonNode metrics) {
        return resume.stream().map(entry -> SIDE_PROJECTS.equals(entry.company()) ? withMetrics(entry, metrics) : entry).toList();
    }

    private static ResumeEntry withMetrics(ResumeEntry entry, JsonNode metrics) {
        List<String> highlights = entry.highlights().stream().map(text -> withMetrics(text, metrics)).toList();
        return new ResumeEntry(entry.role(), entry.company(), entry.contractVia(), entry.dates(), entry.logo(), entry.meta(),
                entry.summary(), highlights);
    }

    static String withMetrics(String text, JsonNode metrics) {
        for (Rule rule : RULES) {
            Matcher match = rule.pattern().matcher(text);
            if (!match.find()) continue;
            Optional<String> live = rule.replacement().apply(metrics);
            if (live.isPresent()) text = match.replaceAll(Matcher.quoteReplacement(live.get()));
        }
        return text;
    }

    /**
     * Checks run and the share that passed, worked out as the daily report does: every UI, API,
     * end-to-end and live test that ran, plus each load request. Left as written unless all five
     * parts are in the report, so a partial run never understates the total.
     */
    private static Optional<String> checks(JsonNode metrics) {
        List<JsonNode> suites = Stream.of("/development/ui", "/development/api", "/qa/regression", "/qa/smoke")
                .map(metrics::at).filter(JsonNode::isObject).toList();
        JsonNode load = metrics.at("/qa/load");
        if (suites.size() < 4 || !load.path("samples").isNumber()) return Optional.empty();
        long ran = 0;
        long passed = 0;
        for (JsonNode suite : suites) {
            JsonNode totals = suite.path("totals");
            ran += suite.path("total").asLong() - totals.path("skipped").asLong();
            passed += totals.path("passed").asLong() + totals.path("flaky").asLong();
        }
        long samples = load.path("samples").asLong();
        ran += samples;
        passed += samples - load.path("failed").asLong();
        if (ran <= 0) return Optional.empty();
        return Optional.of("the latest daily run made " + grouped(ran) + " checks with " + percent(passed, ran) + " passing");
    }

    /** Lines covered across the UI and the API together, as the report's coverage figure. */
    private static Optional<String> coverage(JsonNode metrics) {
        JsonNode ui = metrics.at("/development/ui/coverage");
        JsonNode api = metrics.at("/development/api/coverage");
        if (!ui.path("linesTotal").isNumber() || !api.path("linesTotal").isNumber()) return Optional.empty();
        long total = ui.path("linesTotal").asLong() + api.path("linesTotal").asLong();
        if (total <= 0) return Optional.empty();
        long covered = ui.path("linesCovered").asLong() + api.path("linesCovered").asLong();
        return Optional.of(Math.round(covered * 100.0 / total) + "% of the code is covered");
    }

    /** The report's own rounding: 100% only when nothing failed, otherwise at most 99.9%. */
    static String percent(long part, long whole) {
        if (part == whole) return "100%";
        BigDecimal value = BigDecimal.valueOf(part * 100.0 / whole);
        if (value.compareTo(new BigDecimal("99.95")) >= 0) return "99.9%";
        return value.setScale(1, RoundingMode.HALF_UP).toPlainString() + "%";
    }

    private static Rule rule(String regex, Function<JsonNode, Optional<String>> replacement) {
        return new Rule(Pattern.compile(regex), replacement);
    }

    /** A whole, non-negative number at the pointer, or nothing. */
    private static OptionalLong whole(JsonNode metrics, String pointer) {
        JsonNode node = metrics.at(pointer);
        return node.isNumber() && node.asDouble() >= 0 ? OptionalLong.of(Math.round(node.asDouble())) : OptionalLong.empty();
    }

    /** {@link #whole} written with thousands separators, as the résumé writes numbers. */
    private static Optional<String> count(JsonNode metrics, String pointer) {
        return whole(metrics, pointer).stream().boxed().findFirst().map(LiveResume::grouped);
    }

    private static String grouped(long number) {
        return NumberFormat.getIntegerInstance(Locale.US).format(number);
    }
}

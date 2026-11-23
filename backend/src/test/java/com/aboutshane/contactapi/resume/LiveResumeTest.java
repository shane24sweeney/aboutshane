package com.aboutshane.contactapi.resume;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

import com.aboutshane.contactapi.content.ContentRepository;
import com.aboutshane.contactapi.content.SiteContent.ResumeEntry;
import com.aboutshane.contactapi.status.QualityReport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

public class LiveResumeTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final ContentRepository content = new ContentRepository(JSON);
    private final QualityReport report = mock(QualityReport.class);
    private final LiveResume live = new LiveResume(content, report);

    public static JsonNode sample() {
        try (InputStream in = LiveResumeTest.class.getResourceAsStream("/metrics.sample.json")) {
            return JSON.readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String sideProjects(List<ResumeEntry> resume) {
        return String.join("\n", resume.stream().filter(e -> LiveResume.SIDE_PROJECTS.equals(e.company())).findFirst().orElseThrow().highlights());
    }

    private static ObjectNode edited(String pointer, String field, JsonNode value) {
        ObjectNode metrics = sample().deepCopy();
        ((ObjectNode) metrics.at(pointer)).set(field, value);
        return metrics;
    }

    @Test
    void everyNumberItUpdatesIsInTheResumeAsWritten() {
        // given the Side Projects text in content/resume.json
        String written = sideProjects(content.resume());
        // then each number the report can update is found, so a rewording can't silently stop the updates
        for (LiveResume.Rule rule : LiveResume.RULES) {
            assertThat(rule.pattern().matcher(written).find()).as(rule.pattern().pattern()).isTrue();
        }
    }

    @Test
    void takesTheSideProjectsNumbersFromTheLatestReport() {
        // given the latest daily report
        when(report.metrics()).thenReturn(Optional.of(sample()));
        // when the résumé is read
        String text = sideProjects(live.entries());
        // then its numbers are the report's
        assertThat(text).contains(
                "176 JUnit/MockMvc backend tests",
                "124 Vitest unit tests",
                "on 14 browser and device configurations",
                "2,400+ runs per pull request",
                "plus 130 live production checks",
                "the latest daily run made 3,151 checks with 99.9% passing",
                "98% of the code is covered",
                "typical response under load is 93 ms");
        // and everything else is as written
        assertThat(text).contains("179 Playwright end-to-end tests", "selenium-automation.com");
    }

    @Test
    void changesOnlyTheSideProjects() {
        when(report.metrics()).thenReturn(Optional.of(sample()));
        List<ResumeEntry> written = content.resume();
        List<ResumeEntry> served = live.entries();
        assertThat(served).hasSameSizeAs(written);
        for (int i = 0; i < written.size(); i++) {
            if (!LiveResume.SIDE_PROJECTS.equals(written.get(i).company())) assertThat(served.get(i)).isSameAs(written.get(i));
        }
        assertThat(served.getFirst().summary()).isEqualTo(written.getFirst().summary());
    }

    @Tag("negative")
    @Test
    void keepsTheWrittenNumbersWhenTheReportIsUnavailable() {
        when(report.metrics()).thenReturn(Optional.empty());
        assertThat(live.entries()).isSameAs(content.resume());
    }

    @Tag("negative")
    @Test
    void keepsAWrittenNumberTheReportDoesNotHave() {
        // given a report missing the load test and the API's coverage
        ObjectNode metrics = sample().deepCopy();
        ((ObjectNode) metrics.at("/qa")).remove("load");
        ((ObjectNode) metrics.at("/development/api")).remove("coverage");
        String written = sideProjects(content.resume());
        // when the résumé is read
        String text = sideProjects(LiveResume.withMetrics(content.resume(), metrics));
        // then the numbers it does have are updated, and the rest are left as written
        assertThat(text).contains("124 Vitest unit tests");
        for (String phrase : List.of("typical response under load is \\d+ ms", "\\d+% of the code is covered",
                "the latest daily run made [\\d,]+ checks with [\\d.]+% passing")) {
            assertThat(find(text, phrase)).isEqualTo(find(written, phrase));
        }
    }

    @Tag("negative")
    @Test
    void ignoresNumbersThatMakeNoSense() {
        String text = "176 JUnit/MockMvc backend tests and 2,400+ runs per pull request and 99% of the code is covered";
        assertThat(LiveResume.withMetrics(text, edited("/development/api", "total", JSON.valueToTree(-3)))).contains("176 JUnit");
        assertThat(LiveResume.withMetrics(text, edited("/development/api", "total", JSON.valueToTree("lots")))).contains("176 JUnit");
        assertThat(LiveResume.withMetrics(text, edited("/qa/regression", "total", JSON.valueToTree(40)))).contains("2,400+ runs");
        ObjectNode noLines = sample().deepCopy();
        ((ObjectNode) noLines.at("/development/ui/coverage")).put("linesTotal", 0);
        ((ObjectNode) noLines.at("/development/api/coverage")).put("linesTotal", 0);
        assertThat(LiveResume.withMetrics(text, noLines)).contains("99% of the code");
    }

    @Tag("negative")
    @Test
    void leavesTheChecksAsWrittenWhenNothingRan() {
        ObjectNode metrics = sample().deepCopy();
        for (String suite : List.of("/development/ui", "/development/api", "/qa/regression", "/qa/smoke")) {
            ((ObjectNode) metrics.at(suite)).put("total", 0);
            ((ObjectNode) metrics.at(suite + "/totals")).put("skipped", 0);
        }
        ((ObjectNode) metrics.at("/qa/load")).put("samples", 0);
        String text = "the latest daily run made 3,115 checks with 99.9% passing";
        assertThat(LiveResume.withMetrics(text, metrics)).isEqualTo(text);
    }

    @Test
    void roundsThePassRateLikeTheDailyReport() {
        assertThat(LiveResume.percent(3151, 3151)).isEqualTo("100%");
        assertThat(LiveResume.percent(3150, 3151)).isEqualTo("99.9%");
        assertThat(LiveResume.percent(9990, 10000)).isEqualTo("99.9%");
        assertThat(LiveResume.percent(987, 1000)).isEqualTo("98.7%");
        assertThat(LiveResume.percent(1, 3)).isEqualTo("33.3%");
    }

    private static String find(String text, String regex) {
        var match = java.util.regex.Pattern.compile(regex).matcher(text);
        return match.find() ? match.group() : null;
    }
}

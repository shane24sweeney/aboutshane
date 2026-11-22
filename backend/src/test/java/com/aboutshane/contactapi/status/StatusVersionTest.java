package com.aboutshane.contactapi.status;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Properties;

import com.aboutshane.contactapi.content.ContentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;

/** The version the status reports: the build's own, or "dev" when run without a build (from an IDE). */
class StatusVersionTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-22T12:00:00Z"), ZoneOffset.UTC);

    @SuppressWarnings("unchecked")
    private StatusController controller(BuildProperties build) {
        ObjectProvider<BuildProperties> builds = mock(ObjectProvider.class);
        when(builds.getIfAvailable()).thenReturn(build);
        ObjectProvider<Clock> clocks = mock(ObjectProvider.class);
        when(clocks.getIfAvailable(org.mockito.ArgumentMatchers.any())).thenReturn(clock);
        QualityReport report = mock(QualityReport.class);
        when(report.latest()).thenReturn(Optional.empty());
        return new StatusController(builds, new ContentRepository(new ObjectMapper()), report, clocks);
    }

    @Test
    void reportsTheBuildVersionAndTime() {
        Properties properties = new Properties();
        properties.setProperty("version", "1.4.0");
        properties.setProperty("time", "2026-11-22T10:00:00Z");
        var body = controller(new BuildProperties(properties)).status().getBody();
        assertThat(body.version()).isEqualTo("1.4.0");
        assertThat(body.builtAt()).isEqualTo(Instant.parse("2026-11-22T10:00:00Z"));
    }

    @Test
    void saysDevWhenThereIsNoBuild() {
        var body = controller(null).status().getBody();
        assertThat(body.version()).isEqualTo("dev");
        assertThat(body.builtAt()).isNull();
    }
}

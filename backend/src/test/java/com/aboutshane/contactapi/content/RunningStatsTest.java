package com.aboutshane.contactapi.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.within;

import java.time.Duration;
import java.util.List;

import com.aboutshane.contactapi.content.RunningStats.PersonalBest;
import com.aboutshane.contactapi.content.SiteContent.RaceResult;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class RunningStatsTest {

    private static RaceResult race(String date, String distance, String time) {
        return new RaceResult(date, "Race on " + date, "Atlanta, GA", 33.7545, -84.3898, distance, time, "10:00", 1, 10);
    }

    @ParameterizedTest(name = "\"{0}\" is {1} miles")
    @CsvSource(delimiter = '|', textBlock = """
            5K                    | 3.107
            17K                   | 10.563
            10 miles              | 10.0
            7.5 mile trail        | 7.5
            Obstacle run (3.2 mi) | 3.2
            Half marathon         | 13.109
            Half marathon (trail) | 13.109
            """)
    void readsTheMilesFromEachDistanceLabel(String label, double miles) {
        // given a distance label as it appears on the running page
        // when its miles are worked out, then they match the distance
        assertThat(RunningStats.miles(label)).isCloseTo(miles, within(0.001));
    }

    @Tag("negative")
    @ParameterizedTest(name = "\"{0}\" is rejected")
    @ValueSource(strings = {"Marathon-ish", "", "Fun run", "K5"})
    void rejectsADistanceLabelWithNoDistance(String label) {
        // given a label that names no distance
        // when its miles are worked out, then it is rejected rather than counted as zero
        assertThatIllegalArgumentException().isThrownBy(() -> RunningStats.miles(label));
    }

    @ParameterizedTest(name = "{0} lasts {1} seconds")
    @CsvSource({"34:42, 2082", "1:53:27, 6807", "9:04, 544", "0:00, 0"})
    void readsFinishTimesWithAndWithoutHours(String time, long seconds) {
        // given a finish time in m:ss or h:mm:ss
        // when it is read, then it is that many seconds
        assertThat(RunningStats.duration(time)).isEqualTo(Duration.ofSeconds(seconds));
    }

    @Tag("negative")
    @ParameterizedTest(name = "\"{0}\" is rejected")
    @ValueSource(strings = {"34", "34:60", "1:75:00", "abc", "1:2:3:4", ""})
    void rejectsMalformedFinishTimes(String time) {
        // given a time that is not m:ss or h:mm:ss
        // when it is read, then it is rejected
        assertThatIllegalArgumentException().isThrownBy(() -> RunningStats.duration(time));
    }

    @Test
    void totalsTheRacesAndKeepsTheFastestAtEachDistance() {
        // given two 5Ks, one 10-miler and one half marathon, newest first
        List<RaceResult> races = List.of(
                race("2024-11-28", "5K", "30:10"),
                race("2020-04-04", "10 miles", "1:35:00"),
                race("2018-05-26", "Half marathon", "2:13:07"),
                race("2015-06-13", "5K", "28:12"));

        // when the stats are worked out
        RunningStats stats = RunningStats.from(races);

        // then they count the races and span the years
        assertThat(stats.races()).isEqualTo(4);
        assertThat(stats.firstYear()).isEqualTo(2015);
        assertThat(stats.lastYear()).isEqualTo(2024);
        // and add up the miles (3.107 + 10 + 13.109 + 3.107) and the time (4:46:29)
        assertThat(stats.totalMiles()).isEqualTo(29.3);
        assertThat(stats.totalTime()).isEqualTo("4:46:29");
        // and list one personal best per distance, shortest first, keeping the faster 5K
        assertThat(stats.personalBests())
                .extracting(PersonalBest::distance, PersonalBest::time, PersonalBest::date)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("5K", "28:12", "2015-06-13"),
                        org.assertj.core.groups.Tuple.tuple("10 miles", "1:35:00", "2020-04-04"),
                        org.assertj.core.groups.Tuple.tuple("Half marathon", "2:13:07", "2018-05-26"));
    }

    @Test
    void aTieKeepsTheEarlierListedRace() {
        // given two 5Ks with the same time, newest first
        List<RaceResult> races = List.of(race("2024-01-01", "5K", "30:00"), race("2019-01-01", "5K", "30:00"));

        // when the stats are worked out, then the newer race keeps the personal best
        assertThat(RunningStats.from(races).personalBests()).singleElement()
                .extracting(PersonalBest::date).isEqualTo("2024-01-01");
    }

    @Tag("negative")
    @Test
    void noRacesGivesEmptyStats() {
        // given no races
        // when the stats are worked out
        RunningStats stats = RunningStats.from(List.of());

        // then everything is zero and there are no personal bests
        assertThat(stats.races()).isZero();
        assertThat(stats.totalMiles()).isZero();
        assertThat(stats.totalTime()).isEqualTo("0:00:00");
        assertThat(stats.personalBests()).isEmpty();
    }
}

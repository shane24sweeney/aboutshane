package com.aboutshane.contactapi.content;

import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.aboutshane.contactapi.content.SiteContent.RaceResult;

/**
 * Totals and personal bests worked out from the race history on the running page.
 *
 * @param races         number of races run
 * @param firstYear     year of the oldest race
 * @param lastYear      year of the newest race
 * @param totalMiles    race distance covered, to one decimal place
 * @param totalTime     time spent racing, as h:mm:ss
 * @param personalBests the fastest race at each distance, shortest distance first
 */
public record RunningStats(
        int races, int firstYear, int lastYear, double totalMiles, String totalTime, List<PersonalBest> personalBests) {

    /** The fastest result at one distance. */
    public record PersonalBest(String distance, double miles, String time, String pace, String event, String date) {}

    static final double MILES_PER_KILOMETRE = 0.621371;
    static final double HALF_MARATHON_MILES = 13.1094;

    private static final Pattern KILOMETRES = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*k\\b");
    private static final Pattern MILES = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:mi|mile|miles)\\b");
    private static final Pattern TIME = Pattern.compile("(?:(\\d{1,2}):)?([0-5]?\\d):([0-5]\\d)");

    /** Works out the stats for a newest-first list of races. */
    public static RunningStats from(List<RaceResult> races) {
        if (races.isEmpty()) {
            return new RunningStats(0, 0, 0, 0, formatDuration(Duration.ZERO), List.of());
        }

        double miles = 0;
        Duration time = Duration.ZERO;
        Map<String, RaceResult> fastest = new LinkedHashMap<>();
        for (RaceResult race : races) {
            miles += miles(race.distance());
            time = time.plus(duration(race.time()));
            fastest.merge(race.distance(), race, (best, next) ->
                    duration(next.time()).compareTo(duration(best.time())) < 0 ? next : best);
        }

        List<PersonalBest> personalBests = fastest.values().stream()
                .map(race -> new PersonalBest(
                        race.distance(), round(miles(race.distance())), race.time(), race.pace(), race.event(), race.date()))
                .sorted(Comparator.comparingDouble(PersonalBest::miles).thenComparing(PersonalBest::distance))
                .toList();

        int firstYear = races.stream().mapToInt(race -> year(race.date())).min().orElseThrow();
        int lastYear = races.stream().mapToInt(race -> year(race.date())).max().orElseThrow();
        return new RunningStats(races.size(), firstYear, lastYear, round(miles), formatDuration(time), personalBests);
    }

    /**
     * Miles in a race distance label such as "5K", "10 miles", "Half marathon (trail)" or
     * "Obstacle run (3.2 mi)".
     *
     * @throws IllegalArgumentException when the label names no distance
     */
    static double miles(String distance) {
        String label = distance.toLowerCase(Locale.ROOT);
        if (label.contains("half marathon")) {
            return HALF_MARATHON_MILES;
        }
        Matcher km = KILOMETRES.matcher(label);
        if (km.find()) {
            return Double.parseDouble(km.group(1)) * MILES_PER_KILOMETRE;
        }
        Matcher mi = MILES.matcher(label);
        if (mi.find()) {
            return Double.parseDouble(mi.group(1));
        }
        throw new IllegalArgumentException("No distance in race label: " + distance);
    }

    /**
     * A finish time written as m:ss or h:mm:ss.
     *
     * @throws IllegalArgumentException when the time is not in either form
     */
    static Duration duration(String time) {
        Matcher matcher = TIME.matcher(time);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Not a race time: " + time);
        }
        int hours = matcher.group(1) == null ? 0 : Integer.parseInt(matcher.group(1));
        return Duration.ofHours(hours)
                .plusMinutes(Integer.parseInt(matcher.group(2)))
                .plusSeconds(Integer.parseInt(matcher.group(3)));
    }

    static String formatDuration(Duration duration) {
        return "%d:%02d:%02d".formatted(duration.toHours(), duration.toMinutesPart(), duration.toSecondsPart());
    }

    private static int year(String isoDate) {
        return Integer.parseInt(isoDate.substring(0, 4));
    }

    private static double round(double value) {
        return Math.round(value * 10) / 10.0;
    }
}

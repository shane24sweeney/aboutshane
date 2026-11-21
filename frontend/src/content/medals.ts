// Shane's Apple Fitness medals, in the order the About page shows them: activity awards newest
// first, then monthly challenges, then workout awards. Each image is the medal cropped from an
// Apple Fitness screenshot by scripts/fitness-medals/crop.mjs. `detail` is what Apple shows under
// the medal (a date, a count or a personal record); `took` is what earning it took.

const images = import.meta.glob<string>('../assets/medals/*.webp', { eager: true, import: 'default' });
const image = (name: string) => {
  const src = images[`../assets/medals/${name}.webp`];
  if (!src) throw new Error(`Missing medal image ${name}.webp`);
  return src;
};

export interface Medal {
  image: string;
  name: string;
  detail: string;
  /** What earning it took; empty while unconfirmed. */
  took: string;
}

const medal = (file: string, name: string, detail: string, took = ''): Medal => ({ image: image(file), name, detail, took });

export const medals: Medal[] = [
  medal('Award01', 'Move Goal 200%', 'Nov 14, 2026', 'Burned twice the daily Move goal in one day.'),
  medal('Award02', 'Move Goal 300%', 'Nov 14, 2026', 'Burned three times the daily Move goal in one day.'),
  medal('Award03', 'Move Goal 400%', 'Nov 14, 2026', 'Burned four times the daily Move goal in one day.'),
  medal('Award04', 'Perfect Week (Move)', 'Nov 8, 2026', 'Closed the Move ring every day for a week, Monday to Sunday.'),
  medal('Award05', 'Perfect Week (Stand)', 'Nov 8, 2026', 'Closed the Stand ring every day for a week: up and moving in 12 different hours each day.'),
  medal('Award06', 'Perfect Week (Exercise)', 'Nov 1, 2026', 'Closed the Exercise ring every day for a week, Monday to Sunday.'),
  medal('Award07', 'Perfect Week (All Activity)', 'Nov 1, 2026', 'Closed all three rings, Move, Exercise and Stand, every day for a week.'),
  medal('Award08', 'Activity award', 'May 11, 2026'),
  medal('Award09', '365 Move Goals', 'Jun 29, 2024', 'Closed the Move ring on 365 days.'),
  medal('Award10', '100 Move Goals', 'Feb 6, 2023', 'Closed the Move ring on 100 days.'),
  medal('Award11', 'Activity award', 'Jun 5, 2022'),
  medal('Award12', 'Activity award', 'Jan 22, 2022'),

  medal('Challenge1', 'Veterans Day Challenge', 'Nov 11, 2023', 'A workout of 11 minutes or more on Veterans Day.'),
  medal('Challenge2', 'National Parks Challenge', 'Aug 26, 2023', 'A hike, walk, run or wheelchair workout of 1 mile (1.6 km) or more.'),
  medal('Challenge3', 'Earth Day Challenge', 'Apr 22, 2023', 'A workout of 30 minutes or more on Earth Day.'),
  medal('Challenge4', "International Women's Day Challenge", 'Mar 8, 2023', "A workout of 20 minutes or more on International Women's Day."),
  medal('Challenge5', 'Heart Month Challenge', 'Feb 14, 2023', 'Closed the Exercise ring seven days in a row in February.'),
  medal('Challenge6', 'Lunar New Year Challenge 2023', 'Jan 22, 2023'),
  medal('Challenge7', 'Ring in the New Year Challenge', 'Jan 16, 2023', 'Closed all three rings seven days in a row in January.'),
  medal('Challenge8', 'Veterans Day Challenge', 'Nov 11, 2022', 'A workout of 11 minutes or more on Veterans Day.'),
  medal('Challenge9', 'National Parks Challenge', 'Aug 27, 2022', 'A hike, walk, run or wheelchair workout of 1 mile (1.6 km) or more.'),
  medal('Challenge10', 'Earth Day Challenge', 'Apr 22, 2022', 'A workout of 30 minutes or more on Earth Day.'),
  medal('Challenge11', 'Heart Month Challenge', 'Feb 14, 2022', 'Closed the Exercise ring seven days in a row in February.'),
  medal('Challenge12', 'Lunar New Year Challenge 2022', 'Feb 1, 2022'),

  medal('Workout1', '7-Workout Week', 'Earned 102 times', 'Seven or more workouts in a single week, 102 different weeks.'),
  medal('Workout2', 'HIIT Workout Record', '720 calories', 'Most calories burned in one high-intensity interval training workout.'),
  medal('Workout3', 'Running Workout Record', '1,474 calories', 'Most calories burned in one run.'),
  medal('Workout4', 'Fastest 5K', '30:28', 'Fastest 5K run recorded on the watch.'),
  medal('Workout5', 'Fastest 10K', '1:06:59', 'Fastest 10K run recorded on the watch.'),
  medal('Workout6', 'Longest Running Workout', '10.02 miles', 'Longest single run recorded on the watch.'),
  medal('Workout7', 'Walking Workout Record', '524 calories', 'Most calories burned in one walk.'),
  medal('Workout8', 'First Core Training Workout', 'Apr 30, 2022', 'First core training workout.'),
  medal('Workout9', 'First Functional Strength Training Workout', 'Jan 29, 2022', 'First functional strength training workout.'),
  medal('Workout10', 'First HIIT Workout', 'May 31, 2022', 'First high-intensity interval training workout.'),
  medal('Workout11', 'First Running Workout', 'Jan 6, 2022', 'First run recorded on the watch.'),
  medal('Workout12', '5K Run', 'Earned 90 times', 'Ran 5K or more in one workout, 90 times: at least 279 miles.'),
  medal('Workout13', '10K Run', 'Earned 3 times', 'Ran 10K or more in one workout, 3 times: at least 18.6 miles.'),
  medal('Workout14', 'First Walking Workout', 'Jan 5, 2022', 'First walk recorded on the watch.'),
];

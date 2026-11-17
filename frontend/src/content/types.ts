// Mirrors backend/src/main/java/com/aboutshane/contactapi/content/SiteContent.java and content/*.json.
// Image fields are keys resolved by ./images.ts.

export interface Profile {
  name: string;
  headline: string;
  meta: string;
  summaryTitle: string;
  /** Paragraphs; **double asterisks** mark bold phrases. */
  summary: string[];
  strengthsTitle: string;
  strengths: string[];
  highlightsTitle: string;
  frameworks: string;
  highlights: { label: string; text: string }[];
}

export interface About {
  essay: string;
  signature: string;
}

export interface ResumeEntry {
  role: string;
  company: string;
  /** Staffing firm for contract roles. */
  contractVia?: string;
  /** Years in the role, e.g. "2020 – 2022", "2026" or "2026 – Present". */
  dates: string;
  logo: string;
  /** Location for older roles that have no detailed write-up. */
  meta?: string;
  summary?: string;
  highlights: string[];
}

export interface Testimonial {
  name: string;
  title: string;
  photo?: string;
  recommendation: string;
}

export interface Degree {
  degree: string;
  school: string;
  logo: string;
}

export interface CharityEvent {
  title: string;
  image: string;
  alt: string;
  link?: { href: string; label: string };
}

export interface RaceResult {
  /** ISO date, e.g. "2025-11-27". */
  date: string;
  event: string;
  location: string;
  distance: string;
  /** Chip time, e.g. "34:42" or "1:53:27". */
  time: string;
  /** Minutes per mile, e.g. "11:10". */
  pace: string;
  place: number;
  finishers: number;
}

export interface Running {
  intro: string;
  profile: { href: string; label: string };
  /** Newest first. */
  races: RaceResult[];
}

/** The fastest race at one distance. */
export interface PersonalBest {
  distance: string;
  miles: number;
  time: string;
  pace: string;
  event: string;
  /** ISO date, e.g. "2009-06-13". */
  date: string;
}

/** GET /api/content/running/stats: totals and personal bests worked out by the API. */
export interface RunningStats {
  races: number;
  firstYear: number;
  lastYear: number;
  totalMiles: number;
  /** h:mm:ss, e.g. "39:58:12". */
  totalTime: string;
  /** Shortest distance first. */
  personalBests: PersonalBest[];
}

export interface ContentByPage {
  profile: Profile;
  about: About;
  resume: ResumeEntry[];
  testimonials: Testimonial[];
  education: Degree[];
  charity: CharityEvent[];
  running: Running;
}

export type ContentPage = keyof ContentByPage;

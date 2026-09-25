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
  logo: string;
  /** Location and dates for older roles that have no detailed write-up. */
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

export interface ContentByPage {
  profile: Profile;
  about: About;
  resume: ResumeEntry[];
  testimonials: Testimonial[];
  education: Degree[];
  charity: CharityEvent[];
}

export type ContentPage = keyof ContentByPage;

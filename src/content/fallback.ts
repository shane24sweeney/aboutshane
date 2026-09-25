import about from '../../content/about.json';
import charity from '../../content/charity.json';
import education from '../../content/education.json';
import profile from '../../content/profile.json';
import resume from '../../content/resume.json';
import testimonials from '../../content/testimonials.json';
import type { ContentByPage } from './types';

/** The same files the API serves, bundled so pages still render if the API is unreachable. */
export const fallbackContent: ContentByPage = { profile, about, resume, testimonials, education, charity };

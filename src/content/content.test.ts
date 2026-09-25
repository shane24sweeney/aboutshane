import { fallbackContent } from './fallback';
import { charityImages, logos, people, schoolLogos } from './images';

// The content files and the bundled images must agree, or a page renders a broken image.
describe('content files', () => {
  it('every resume logo key has a bundled image', () => {
    for (const { company, logo } of fallbackContent.resume) {
      expect(logos[logo], `${company}: ${logo}`).toBeDefined();
    }
  });

  it('every testimonial photo key has a bundled image', () => {
    for (const { name, photo } of fallbackContent.testimonials) {
      if (photo) expect(people[photo], `${name}: ${photo}`).toBeDefined();
    }
  });

  it('every education and charity image key has a bundled image', () => {
    for (const { logo } of fallbackContent.education) expect(schoolLogos[logo], logo).toBeDefined();
    for (const { image } of fallbackContent.charity) expect(charityImages[image], image).toBeDefined();
  });

  it('home summary bold markers are balanced', () => {
    for (const paragraph of fallbackContent.profile.summary) {
      expect(paragraph.split('**').length % 2, paragraph).toBe(1);
    }
  });
});

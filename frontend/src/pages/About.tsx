import Carousel from 'react-bootstrap/Carousel';
import SiteCarousel from '../components/SiteCarousel';
import PageLoading from '../components/PageLoading';
import { formatIsoDate } from '../content/dates';
import { usePageContent } from '../hooks/usePageContent';
import './About.css';

// Activity awards first (newest first), then challenge results, then workout logs, each in numeric
// order. Award files are named Award<NN>-<yyyy-mm-dd>.webp; the date becomes the alt text.
const photoModules = import.meta.glob<string>('../assets/fitness/*.{png,webp}', { eager: true, import: 'default' });
const KIND_ORDER = ['Award', 'Challenge', 'Workout'];

const fitnessPhotos = Object.entries(photoModules)
  .map(([path, src]) => {
    const [, kind = '', number = '0', date] = /\/(Award|Challenge|Workout)(\d+)(?:-(\d{4}-\d{2}-\d{2}))?\.(?:png|webp)$/.exec(path) ?? [];
    return { kind, number: Number(number), date, src };
  })
  .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.number - b.number)
  .map(({ kind, number, date, src }) => ({
    src,
    alt:
      kind === 'Award' && date
        ? `Apple Watch activity award, ${formatIsoDate(date)}`
        : kind === 'Challenge'
          ? `Fitness challenge result ${number}`
          : `Workout log ${number}`,
  }));

function About() {
  const content = usePageContent('about');

  return (
    <section id="about" className="carousel-page about-page">
      <h1 className="visually-hidden">About Shane</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        <div className="carousel-card about-card">
          <SiteCarousel label="About Shane" className="about-carousel">
            <Carousel.Item interval={5000}>
              <p>{content.data.essay}</p>
              <cite>{content.data.signature}</cite>
            </Carousel.Item>
            {fitnessPhotos.map(({ src, alt }) => (
              <Carousel.Item key={src} interval={1000}>
                <img className="d-block mx-auto" src={src} alt={alt} loading="lazy" />
              </Carousel.Item>
            ))}
          </SiteCarousel>
        </div>
      )}
    </section>
  );
}

export default About;

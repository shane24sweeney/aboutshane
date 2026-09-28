import Carousel from 'react-bootstrap/Carousel';
import SiteCarousel from '../components/SiteCarousel';
import PageLoading from '../components/PageLoading';
import { usePageContent } from '../hooks/usePageContent';
import './About.css';

// Challenge results first, then workout logs, each in numeric order.
const photoModules = import.meta.glob<string>('../assets/fitness/*.png', { eager: true, import: 'default' });

const fitnessPhotos = Object.entries(photoModules)
  .map(([path, src]) => {
    const [, kind = '', number = '0'] = /\/(Challenge|Workout)(\d+)\.png$/.exec(path) ?? [];
    return { kind, number: Number(number), src };
  })
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.number - b.number)
  .map(({ kind, number, src }) => ({
    src,
    alt: kind === 'Challenge' ? `Fitness challenge result ${number}` : `Workout log ${number}`,
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

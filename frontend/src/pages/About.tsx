import Carousel from 'react-bootstrap/Carousel';
import SiteCarousel from '../components/SiteCarousel';
import PageLoading from '../components/PageLoading';
import SpinningMedal from '../components/SpinningMedal';
import { medals } from '../content/medals';
import { usePageContent } from '../hooks/usePageContent';
import './About.css';

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
            {medals.map(({ image, name, detail, took }) => (
              <Carousel.Item key={image} interval={4000} className="about-medal">
                <SpinningMedal src={image} alt={`${name} medal`} />
                <h2 className="about-medal-name">{name}</h2>
                <p className="about-medal-detail">{detail}</p>
                {took && <p className="about-medal-took">{took}</p>}
              </Carousel.Item>
            ))}
          </SiteCarousel>
        </div>
      )}
    </section>
  );
}

export default About;

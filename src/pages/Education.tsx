import Carousel from 'react-bootstrap/Carousel';
import PageLoading from '../components/PageLoading';
import { schoolLogos } from '../content/images';
import { usePageContent } from '../hooks/usePageContent';
import './CarouselPages.css';

function Education() {
  const content = usePageContent('education');

  return (
    <section id="education" className="carousel-page">
      <h1 className="visually-hidden">Education</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        <div className="carousel-card">
          <Carousel className="page-carousel" controls={false} indicators={false}>
            {content.data.map(({ degree, logo, school }) => (
              <Carousel.Item key={degree} interval={4000}>
                <img className="page-carousel-logo" src={schoolLogos[logo]} alt={school} />
                <h2>{degree}</h2>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      )}
    </section>
  );
}

export default Education;

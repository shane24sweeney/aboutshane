import Carousel from 'react-bootstrap/Carousel';
import SiteCarousel from '../components/SiteCarousel';
import PageLoading from '../components/PageLoading';
import { campusPhotos, schoolLogos } from '../content/images';
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
          <SiteCarousel label="Education" className="page-carousel">
            {content.data.map(({ degree, logo, school, campus }) => (
              <Carousel.Item key={degree} interval={4000}>
                <figure className="education-campus">
                  <img className="education-campus-photo" src={campusPhotos[campus.image]} alt={campus.alt} />
                  <figcaption className="education-campus-credit">
                    Photo: {campus.author},{' '}
                    <a href={campus.license.href} target="_blank" rel="noreferrer">
                      {campus.license.label}
                    </a>
                    , via{' '}
                    <a href={campus.source.href} target="_blank" rel="noreferrer">
                      {campus.source.label}
                    </a>
                  </figcaption>
                </figure>
                <img className="education-logo" data-logo={logo} src={schoolLogos[logo]} alt={`${school} logo`} />
                <h2>{degree}</h2>
              </Carousel.Item>
            ))}
          </SiteCarousel>
        </div>
      )}
    </section>
  );
}

export default Education;

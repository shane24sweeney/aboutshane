import Button from 'react-bootstrap/Button';
import Carousel from 'react-bootstrap/Carousel';
import PageLoading from '../components/PageLoading';
import { charityImages } from '../content/images';
import { usePageContent } from '../hooks/usePageContent';
import './CarouselPages.css';

function Charity() {
  const content = usePageContent('charity');

  return (
    <section id="charity" className="carousel-page">
      <h1 className="visually-hidden">Charity Work</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        <div className="carousel-card">
          <Carousel className="page-carousel charity-carousel" controls={false} indicators={false}>
            {content.data.map(({ title, image, alt, link }) => (
              <Carousel.Item key={title} interval={4000}>
                <h2>{title}</h2>
                {link && (
                  <Button variant="success" href={link.href} target="_blank" rel="noreferrer" className="rounded-pill">
                    {link.label}
                  </Button>
                )}
                <img className="page-carousel-logo" src={charityImages[image]} alt={alt} />
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      )}
    </section>
  );
}

export default Charity;

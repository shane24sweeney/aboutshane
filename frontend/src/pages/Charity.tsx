import Button from 'react-bootstrap/Button';
import PageLoading from '../components/PageLoading';
import { charityImages } from '../content/images';
import { usePageContent } from '../hooks/usePageContent';
import './CarouselPages.css';

function Charity() {
  const content = usePageContent('charity');

  return (
    <section id="charity" className="carousel-page">
      <h1 className="grid-page-title">Giving back</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        // Every charity at once, as a grid of cards.
        <ul className="card-grid charity-grid" aria-label="Charities">
          {content.data.map(({ title, image, alt, link }) => (
            <li key={title} className="grid-card charity-card">
              <img className="charity-card-image" src={charityImages[image]} alt={alt} />
              <h2>{title}</h2>
              {link && (
                <Button variant="success" href={link.href} target="_blank" rel="noreferrer" className="rounded-pill">
                  {link.label}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Charity;

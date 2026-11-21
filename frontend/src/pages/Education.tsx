import PageLoading from '../components/PageLoading';
import { campusPhotos, schoolLogos } from '../content/images';
import { usePageContent } from '../hooks/usePageContent';
import './CarouselPages.css';

function Education() {
  const content = usePageContent('education');

  return (
    <section id="education" className="carousel-page">
      <h1 className="grid-page-title">Education</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        // Every degree at once, side by side on wide screens.
        <ul className="card-grid education-grid" aria-label="Degrees">
          {content.data.map(({ degree, logo, school, campus }) => (
            <li key={degree} className="grid-card education-card">
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Education;

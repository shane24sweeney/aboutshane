import Carousel from 'react-bootstrap/Carousel';
import PageLoading from '../components/PageLoading';
import { people } from '../content/images';
import { usePageContent } from '../hooks/usePageContent';
import './Testimonials.css';

function Testimonials() {
  const content = usePageContent('testimonials');

  return (
    <div className="testimonials-page">
      <h1 className="visually-hidden">Testimonials</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        <div className="testimonials-card">
          <Carousel className="testimonials-carousel" controls={false} indicators={false}>
            {content.data.map(({ name, title, photo, recommendation }) => (
              <Carousel.Item key={name} interval={4000}>
                {photo && people[photo] && <img className="testimonial-photo" src={people[photo]} alt={name} />}
                <h2 className="testimonial-name">{name}</h2>
                <p className="testimonial-title">{title}</p>
                <blockquote className="testimonial-quote">
                  <p>{recommendation}</p>
                </blockquote>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
}

export default Testimonials;

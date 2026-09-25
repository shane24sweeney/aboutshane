import Carousel from 'react-bootstrap/Carousel';
import { testimonials } from '../data/testimonials';
import './Testimonials.css';

function Testimonials() {
  return (
    <div className="testimonials-page">
      <h1 className="visually-hidden">Testimonials</h1>
      <div className="testimonials-card">
        <Carousel className="testimonials-carousel" controls={false} indicators={false}>
          {testimonials.map(({ name, title, photo, recommendation }) => (
            <Carousel.Item key={name} interval={4000}>
              {photo && <img className="testimonial-photo" src={photo} alt={name} />}
              <h2 className="testimonial-name">{name}</h2>
              <p className="testimonial-title">{title}</p>
              <blockquote className="testimonial-quote">
                <p>{recommendation}</p>
              </blockquote>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
}

export default Testimonials;

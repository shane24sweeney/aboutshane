import Carousel from 'react-bootstrap/Carousel';
import ncState from '../assets/education/NCState.jpeg';
import ucc from '../assets/education/UCC.jpeg';
import './CarouselPages.css';

const degrees = [
  { degree: 'Masters in Computer Science - 2015', logo: ncState, school: 'North Carolina State University' },
  { degree: 'Higher Diploma Computer Science - 1998/1999', logo: ucc, school: 'University College Cork' },
  { degree: 'B.A. Mathematical Studies and Sociology - 1995/1998', logo: ucc, school: 'University College Cork' },
];

function Education() {
  return (
    <section id="education" className="carousel-page">
      <h1 className="visually-hidden">Education</h1>
      <div className="carousel-card">
        <Carousel className="page-carousel" controls={false} indicators={false}>
          {degrees.map(({ degree, logo, school }) => (
            <Carousel.Item key={degree} interval={4000}>
              <img className="page-carousel-logo" src={logo} alt={school} />
              <h2>{degree}</h2>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

export default Education;

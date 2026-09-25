import Button from 'react-bootstrap/Button';
import Carousel from 'react-bootstrap/Carousel';
import dalton from '../assets/charity/Dalton.jpg';
import dogDays from '../assets/charity/DogDays.png';
import habitat from '../assets/charity/Habitat.jpg';
import polarPlunge from '../assets/charity/PolarPlunge.png';
import susanKomen from '../assets/charity/SusanKomen.jpeg';
import './CarouselPages.css';

interface CharityEvent {
  title: string;
  image: string;
  alt: string;
  link?: { href: string; label: string };
}

const events: CharityEvent[] = [
  {
    title: 'Raised money and took part in the polar plunge for the Special Olympics',
    image: polarPlunge,
    alt: 'Polar plunge for the Special Olympics',
  },
  {
    title: 'Support Website for Dog Days Rescue',
    image: dogDays,
    alt: 'Dog Days Rescue',
    link: { href: 'https://www.dogdaysrescue.org/', label: 'Dog Days Rescue Charity' },
  },
  {
    title: 'Raised money and ran in the Susan G Komen Race For The Cure',
    image: susanKomen,
    alt: 'Susan G. Komen Race for the Cure',
  },
  { title: 'Yearly Dalton Ten Miler Race for Charity', image: dalton, alt: 'Dalton Ten Miler race' },
  { title: 'Yearly 18K Habitat for Humanity Helen Race for Charity', image: habitat, alt: 'Habitat for Humanity Helen 18K race' },
];

function Charity() {
  return (
    <section id="charity" className="carousel-page">
      <h1 className="visually-hidden">Charity Work</h1>
      <div className="carousel-card">
        <Carousel className="page-carousel charity-carousel" controls={false} indicators={false}>
          {events.map(({ title, image, alt, link }) => (
            <Carousel.Item key={title} interval={4000}>
              <h2>{title}</h2>
              {link && (
                <Button variant="success" href={link.href} target="_blank" rel="noreferrer" className="rounded-pill">
                  {link.label}
                </Button>
              )}
              <img className="page-carousel-logo" src={image} alt={alt} />
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

export default Charity;

import Carousel from 'react-bootstrap/Carousel';
import './About.css';

// Challenge results first, then workout logs, each in numeric order.
const photoModules = import.meta.glob<string>('../assets/fitness/*.png', { eager: true, import: 'default' });

const fitnessPhotos = Object.entries(photoModules)
  .map(([path, src]) => {
    const [, kind = '', number = '0'] = /\/(Challenge|Workout)(\d+)\.png$/.exec(path) ?? [];
    return { kind, number: Number(number), src };
  })
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.number - b.number)
  .map(({ kind, number, src }) => ({
    src,
    alt: kind === 'Challenge' ? `Fitness challenge result ${number}` : `Workout log ${number}`,
  }));

function About() {
  return (
    <section id="about" className="carousel-page about-page">
      <h1 className="visually-hidden">About Shane</h1>
      <div className="carousel-card about-card">
        <Carousel className="about-carousel" controls={false} indicators={false}>
          <Carousel.Item interval={5000}>
            <p>
              Your mind is clear. Your heart rate is racing with anticipation and excitement. The world&apos;s
              surroundings suddenly disappear and it&apos;s just you and the open road ahead. That is running a race in
              a nutshell. For an avid runner, this is the motivation to keep going. Completing something from start to
              finish for a sense of accomplishment and victory. The feeling and high from being a software developer is
              very similar. You receive the same satisfaction of seeing something through from beginning to end. The
              excitement and anticipation of knowing you&apos;re about to create something new is unlike any other. A
              challenge has been extended and accepted, and it&apos;s time to see it through to victory. I am both a
              runner and a software developer, and feel very fortunate to be able to experience such satisfaction in
              both my career and fitness journey.
            </p>
            <cite>Shane James Sweeney, You have to fail to succeed</cite>
          </Carousel.Item>
          {fitnessPhotos.map(({ src, alt }) => (
            <Carousel.Item key={src} interval={1000}>
              <img className="d-block mx-auto" src={src} alt={alt} loading="lazy" />
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

export default About;

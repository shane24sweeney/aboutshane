import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import { FaChevronLeft, FaChevronRight, FaPause, FaPlay } from 'react-icons/fa6';
import './SiteCarousel.css';

interface SiteCarouselProps {
  /** Names the carousel region for screen readers, e.g. "Testimonials". */
  label: string;
  className?: string;
  /** Autoplay delay for slides that don't set their own Carousel.Item interval. */
  interval?: number;
  /** Carousel.Item elements. */
  children: ReactNode;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * The react-bootstrap Carousel every page uses:
 * - Every slide takes the tallest slide's height (SiteCarousel.css), so changing slides never
 *   resizes the carousel or moves the page under someone who is scrolling.
 * - Autoplay stops for good once the visitor touches, clicks or focuses the carousel or uses
 *   its controls, and never starts for prefers-reduced-motion. Hovering pauses it (WCAG 2.2.2).
 * - Previous, pause/play and next buttons and a "2 of 11" position sit below the slides.
 */
function SiteCarousel({ label, className = '', interval = 5000, children }: SiteCarouselProps) {
  const count = Children.count(children);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const slidesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slides = slidesRef.current;
    if (!playing || !slides) return;
    const stop = () => setPlaying(false);
    slides.addEventListener('pointerdown', stop);
    slides.addEventListener('focusin', stop);
    return () => {
      slides.removeEventListener('pointerdown', stop);
      slides.removeEventListener('focusin', stop);
    };
  }, [playing]);

  const show = (next: number) => {
    setPlaying(false);
    setIndex((next + count) % count);
  };

  return (
    <div className="site-carousel-wrapper">
      <div ref={slidesRef}>
        <Carousel
          className={`site-carousel ${className}`}
          activeIndex={index}
          onSelect={(next, event) => (event ? show(next) : setIndex(next))}
          interval={playing ? interval : null}
          controls={false}
          indicators={false}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
        >
          {children}
        </Carousel>
      </div>
      {count > 1 && (
        <div className="site-carousel-controls">
          <button type="button" onClick={() => show(index - 1)} aria-label="Previous slide">
            <FaChevronLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
            {playing ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => show(index + 1)} aria-label="Next slide">
            <FaChevronRight aria-hidden="true" />
          </button>
          <span className="site-carousel-position" aria-live={playing ? 'off' : 'polite'}>
            {index + 1} of {count}
          </span>
        </div>
      )}
    </div>
  );
}

export default SiteCarousel;

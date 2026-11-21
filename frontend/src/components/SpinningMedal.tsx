import { useRef, useState, type PointerEvent } from 'react';
import './SpinningMedal.css';

/** Degrees of turn per pixel dragged. */
const DRAG_RATE = 0.9;

/**
 * A medal that spins into view, like the Apple Fitness app: it turns once each time its slide
 * appears, and the visitor can drag it sideways to spin it, after which it settles facing front.
 * Visitors who prefer reduced motion get no automatic spin (dragging still works).
 */
function SpinningMedal({ src, alt }: { src: string; alt: string }) {
  const [angle, setAngle] = useState(0);
  const [settling, setSettling] = useState(false);
  const drag = useRef<{ startX: number; startAngle: number; lastX: number; lastTime: number; velocity: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    // Keep receiving the drag if the pointer leaves the medal; not every pointer can be captured.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The drag still works while the pointer stays over the medal.
    }
    drag.current = { startX: event.clientX, startAngle: angle, lastX: event.clientX, lastTime: event.timeStamp, velocity: 0 };
    setSettling(false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    event.stopPropagation();
    const elapsed = Math.max(event.timeStamp - current.lastTime, 1);
    current.velocity = ((event.clientX - current.lastX) * DRAG_RATE) / elapsed;
    current.lastX = event.clientX;
    current.lastTime = event.timeStamp;
    setAngle(current.startAngle + (event.clientX - current.startX) * DRAG_RATE);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    event.stopPropagation();
    drag.current = null;
    // Carry on in the direction of the flick, then come to rest facing front.
    const coasted = angle + current.velocity * 300;
    setSettling(true);
    setAngle(Math.round(coasted / 360) * 360);
  };

  return (
    <div
      className="spinning-medal"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      // Stop a drag on the medal from also swiping the carousel to the next slide.
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
    >
      <div className="spinning-medal-intro">
        <div
          className={`spinning-medal-body${settling ? ' is-settling' : ''}`}
          style={{ transform: `rotateY(${angle}deg)` }}
          onTransitionEnd={() => {
            setSettling(false);
            setAngle(0);
          }}
        >
          <img className="spinning-medal-face" src={src} alt={alt} draggable={false} />
          {/* The reverse side is decoration, so it's a background rather than a second image. */}
          <div className="spinning-medal-face spinning-medal-back" style={{ backgroundImage: `url(${src})` }} />
        </div>
      </div>
    </div>
  );
}

export default SpinningMedal;

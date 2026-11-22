import type { IconBaseProps } from 'react-icons';

/** A small globe that turns slowly on its tile (still for visitors who prefer reduced motion). */
function SpinningEarth({ className }: IconBaseProps) {
  return <span className={`${className ?? ''} nav-earth`} />;
}

export default SpinningEarth;

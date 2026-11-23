import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sample from '../e2e/support/metrics.sample.json';
import visitors from '../e2e/support/visitors.sample.json';

// The real 3D components (setup.ts swaps them for stand-ins everywhere else). jsdom has no WebGL,
// like an old browser or one with WebGL switched off: they must say so rather than break the page.
vi.unmock('../../frontend/src/components/TestGrid3D');
vi.unmock('../../frontend/src/components/VisitorGlobe3D');
vi.unmock('../../frontend/src/components/VisitorMolecule3D');
const { default: TestGrid3D } = await import('../../frontend/src/components/TestGrid3D');
const { default: VisitorGlobe3D } = await import('../../frontend/src/components/VisitorGlobe3D');
const { default: VisitorMolecule3D } = await import('../../frontend/src/components/VisitorMolecule3D');

describe('3D views in a browser without WebGL', { tags: ['negative'] }, () => {
  // What a browser without WebGL answers when asked for a WebGL context.
  beforeEach(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null));

  it('the test grid says it cannot draw 3D and points to the table', () => {
    render(<TestGrid3D grid={sample.grid as Parameters<typeof TestGrid3D>[0]['grid']} onSelect={() => {}} />);
    const stage = screen.getByTestId('test-grid-3d');
    expect(stage).toHaveTextContent("This browser can't draw 3D. The table below has the same numbers.");
    expect(stage).not.toHaveTextContent('Drag to rotate');
    expect(stage.querySelector('canvas')).toBeNull();
  });

  it('the globe says it cannot draw 3D and points to the list', () => {
    render(<VisitorGlobe3D countries={visitors.countries} selected={null} onSelect={() => {}} />);
    const stage = screen.getByTestId('visitor-globe');
    expect(stage).toHaveTextContent("This browser can't draw 3D. The list beside it has the same numbers.");
    expect(stage).not.toHaveTextContent('Drag to turn');
    expect(stage.querySelector('canvas')).toBeNull();
  });

  it('the molecule says it cannot draw 3D, points to the lists, and still describes itself', () => {
    render(<VisitorMolecule3D stats={visitors as Parameters<typeof VisitorMolecule3D>[0]['stats']} />);
    const stage = screen.getByTestId('visitor-molecule');
    expect(stage).toHaveTextContent("This browser can't draw 3D. The lists below have the same numbers.");
    expect(stage).not.toHaveTextContent('Drag to turn');
    expect(stage.querySelector('canvas')).toBeNull();
    expect(screen.getByRole('img', { name: /^The site as a molecule: 7 pages, 12 countries and 7 speed measures/ })).toBe(stage);
  });

  it('a browser that throws when asked for WebGL gets the same fallback', () => {
    vi.restoreAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('WebGL blocked');
    });
    render(<VisitorGlobe3D countries={visitors.countries} selected="US" onSelect={() => {}} />);
    expect(screen.getByTestId('visitor-globe')).toHaveTextContent("This browser can't draw 3D.");
  });
});

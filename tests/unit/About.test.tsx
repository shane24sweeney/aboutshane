import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../../frontend/src/App';

describe('about page', () => {
  it('shows the activity awards first, newest first, each described by its date', async () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1, name: 'About Shane' });
    // The heading is there while the content is still loading, so wait for the photos themselves.
    await screen.findAllByAltText(/^Apple Watch activity award/);

    const alts = Array.from(document.querySelectorAll('img')).map((image) => image.getAttribute('alt') ?? '');
    const awards = alts.filter((alt) => alt.startsWith('Apple Watch activity award'));
    expect(awards).toHaveLength(12);
    expect(awards[0]).toBe('Apple Watch activity award, Nov 14, 2026');
    expect(awards[awards.length - 1]).toBe('Apple Watch activity award, Jan 22, 2022');
    expect(alts.indexOf(awards[0]!)).toBeLessThan(alts.indexOf('Fitness challenge result 1'));
  });
});

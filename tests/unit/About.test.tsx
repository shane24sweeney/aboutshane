import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../../frontend/src/App';
import { medals } from '../../frontend/src/content/medals';

describe('about page', () => {
  it('shows every Apple Fitness medal with its name, detail and what it took, awards first', async () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1, name: 'About Shane' });
    // The heading is there while the content is still loading, so wait for the medals themselves.
    const names = await screen.findAllByRole('heading', { level: 2 });
    expect(names.map((name) => name.textContent)).toEqual(medals.map(({ name }) => name));

    const slides = names.map((name) => name.closest<HTMLElement>('.carousel-item')!);
    for (const [index, slide] of slides.entries()) {
      const { name, detail, took } = medals[index]!;
      expect(within(slide).getByRole('img', { name: `${name} medal` })).toBeInTheDocument();
      expect(within(slide).getByText(detail)).toBeInTheDocument();
      if (took) expect(within(slide).getByText(took)).toBeInTheDocument();
    }
    expect(medals[0]!.name).toBe('Move Goal 200%');
    expect(medals.findIndex(({ name }) => name.endsWith('Challenge'))).toBe(12);
  });
});

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('routing', () => {
  it.each([
    ['/home', 'Shane James Sweeney'],
    ['/about', 'About Shane'],
    ['/contact', 'Send me a message.'],
    ['/resume', 'Professional Experience'],
    ['/testimonials', 'Testimonials'],
    ['/education', 'Education'],
    ['/charity', 'Charity Work'],
  ])('%s renders a single page heading "%s"', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it.each(['/', '/no-such-page'])('redirects %s to the home page', async (path) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: 'Shane James Sweeney' })).toBeInTheDocument();
  });

  it('gives every navigation link an accessible name', () => {
    renderAt('/home');
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    const names = Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('aria-label'));
    expect(names).toEqual(['Home', 'Contact', 'About', 'Resume', 'Testimonials', 'Education', 'Charity Work']);
  });

  it('gives every image alt text', async () => {
    for (const path of ['/home', '/about', '/resume', '/testimonials', '/education', '/charity']) {
      const { unmount } = renderAt(path);
      await screen.findByRole('heading', { level: 1 });
      for (const image of document.querySelectorAll('img')) {
        expect(image.getAttribute('alt'), `${path}: ${image.getAttribute('src')}`).toBeTruthy();
      }
      unmount();
    }
  });
});

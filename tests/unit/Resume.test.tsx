import { render, screen, within } from '@testing-library/react';
import { fallbackContent } from '../../frontend/src/content/fallback';
import Resume from '../../frontend/src/pages/Resume';

const resume = fallbackContent.resume;

describe('Resume page', () => {
  it('offers the résumé as a PDF download from the API', async () => {
    render(<Resume />);
    const link = await screen.findByRole('link', { name: 'Download résumé (PDF)' });
    expect(link).toHaveAttribute('href', '/api/resume.pdf');
    expect(link).toHaveAttribute('download', 'Shane-James-Sweeney-Resume.pdf');
  });

  it('lists every role with its company logo', async () => {
    render(<Resume />);
    const buttons = await screen.findAllByRole('button');
    expect(buttons).toHaveLength(resume.length);
    expect(buttons[0]).toHaveTextContent('Full Stack Developer & QA Engineer - Side Projects');
    expect(buttons[1]).toHaveTextContent('Senior QE Consultant - Fifth Third Bank (Contract via TEKsystems)');
    // Vite inlines a small SVG as a data: URL, so the source is either the file or the SVG itself.
    expect(screen.getByAltText('Side Projects logo')).toHaveAttribute('src', expect.stringMatching(/SideProjects|^data:image\/svg\+xml/));
    expect(screen.getByAltText('Fifth Third Bank logo')).toHaveAttribute('src', expect.stringContaining('FifthThirdBank'));
  });

  it('shows every role with its dates', async () => {
    render(<Resume />);
    const buttons = await screen.findAllByRole('button');
    buttons.forEach((button, index) => expect(button).toHaveTextContent(resume[index]?.dates ?? 'missing'));
    expect(buttons[0]).toHaveTextContent('2023 – Present');
    expect(buttons[1]).toHaveTextContent('2026');
    expect(buttons[1]).not.toHaveTextContent('Present');
  });

  it('opens the side projects first, with their highlights as a bulleted list', async () => {
    render(<Resume />);
    const button = await screen.findByRole('button', { name: /Side Projects/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const item = button.closest<HTMLElement>('.accordion-item');
    if (!item) throw new Error('accordion item not found');
    const list = within(item).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(resume[0]?.highlights.length ?? 0);
    expect(list).toHaveTextContent('React 18 + TypeScript front end and a Java 25 / Spring Boot 3.5 API');
    expect(screen.getByRole('button', { name: /Fifth Third Bank/i })).toHaveAttribute('aria-expanded', 'false');
  });
});

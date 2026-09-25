import { render, screen, within } from '@testing-library/react';
import { fallbackContent } from '../content/fallback';
import Resume from './Resume';

const resume = fallbackContent.resume;

describe('Resume page', () => {
  it('lists every role with its company logo', async () => {
    render(<Resume />);
    const buttons = await screen.findAllByRole('button');
    expect(buttons).toHaveLength(resume.length);
    expect(buttons[0]).toHaveTextContent('SENIOR QE CONSULTANT - FIFTH THIRD BANK (Contract via TEKsystems)');
    expect(screen.getByAltText('Fifth Third Bank logo')).toHaveAttribute('src', expect.stringContaining('FifthThirdBank'));
  });

  it('shows every role with its dates', async () => {
    render(<Resume />);
    const buttons = await screen.findAllByRole('button');
    buttons.forEach((button, index) => expect(button).toHaveTextContent(resume[index]?.dates ?? 'missing'));
    expect(buttons[0]).toHaveTextContent('2026 – Present');
  });

  it('opens the current role with its highlights as a bulleted list', async () => {
    render(<Resume />);
    const button = await screen.findByRole('button', { name: /FIFTH THIRD BANK/ });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const item = button.closest<HTMLElement>('.accordion-item');
    if (!item) throw new Error('accordion item not found');
    const list = within(item).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(resume[0]?.highlights.length ?? 0);
    expect(list).toHaveTextContent('increasing automated test coverage from 45% to 80%');
  });
});

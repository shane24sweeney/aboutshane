import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resume } from '../data/resume';
import Resume from './Resume';

describe('Resume page', () => {
  it('lists every role with its company logo', () => {
    render(<Resume />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(resume.length);
    expect(buttons[0]).toHaveTextContent('SENIOR QE CONSULTANT - FIFTH THIRD BANK (Contract via TEKsystems)');
    expect(screen.getByAltText('Fifth Third Bank logo')).toBeInTheDocument();
  });

  it('shows highlights as a bulleted list when a role is expanded', async () => {
    render(<Resume />);
    const button = screen.getByRole('button', { name: /FIFTH THIRD BANK/ });
    await userEvent.setup().click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const item = button.closest<HTMLElement>('.accordion-item');
    if (!item) throw new Error('accordion item not found');
    const list = within(item).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(resume[0]?.highlights.length ?? 0);
    expect(list).toHaveTextContent('increasing automated test coverage from 45% to 80%');
  });

  it('has no leftover PDF copy-paste artifacts', () => {
    const text = JSON.stringify(resume);
    expect(text).not.toMatch(/tesDng|SoMware|ﬀ|ﬁ|ﬂ|•/);
  });
});

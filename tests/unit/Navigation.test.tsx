import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Navigation from '../../frontend/src/components/Navigation';
import SubNav from '../../frontend/src/components/SubNav';
import { groupFor, NAV_GROUPS } from '../../frontend/src/navigation';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navigation />
      <SubNav />
    </MemoryRouter>,
  );

describe('navigation groups', () => {
  it('has five groups, within the 3 to 5 a phone tab bar should hold', () => {
    expect(NAV_GROUPS.map((g) => g.label)).toEqual(['Home', 'Experience', 'Quality', 'About', 'Contact']);
  });

  it('puts every page in exactly one group, and each group’s tile opens its first page', () => {
    const paths = NAV_GROUPS.flatMap((g) => g.pages.map((p) => p.to));
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.sort()).toEqual(['/about', '/analytics', '/charity', '/contact', '/education', '/home', '/metrics', '/resume', '/running', '/testimonials']);
    for (const group of NAV_GROUPS) expect(group.to).toBe(group.pages[0]!.to);
  });

  it('finds the group for a page, ignoring a trailing slash', () => {
    expect(groupFor('/education')?.label).toBe('Experience');
    expect(groupFor('/analytics/')?.label).toBe('Quality');
    expect(groupFor('/nowhere')).toBeUndefined();
  });
});

describe('Navigation and SubNav', () => {
  it('highlights the group on every one of its pages', () => {
    renderAt('/running');
    const primary = screen.getByRole('navigation', { name: 'Primary navigation' });
    const about = within(primary).getByRole('link', { name: 'About' });
    expect(about).toHaveClass('active');
    expect(about).toHaveAttribute('aria-current', 'page');
    expect(within(primary).getByRole('link', { name: 'Experience' })).not.toHaveClass('active');
  });

  it('shows the group’s pages as sub-tabs, with the current one marked', () => {
    renderAt('/education');
    const tabs = screen.getByRole('navigation', { name: 'Experience pages' });
    expect(within(tabs).getAllByRole('link').map((l) => l.textContent)).toEqual(['Résumé', 'Education', 'Testimonials']);
    expect(within(tabs).getByRole('link', { name: 'Education' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows no sub-tabs on pages that are a group of their own', () => {
    for (const path of ['/home', '/contact']) {
      const { unmount } = renderAt(path);
      expect(screen.queryByRole('navigation', { name: /pages$/ })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('labels Contact as a "Contact me" button on wide screens, keeping its name for screen readers', () => {
    renderAt('/home');
    const contact = screen.getByRole('link', { name: 'Contact' });
    expect(contact).toHaveClass('nav-cta');
    expect(within(contact).getByText('Contact me')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardPage from '../page';

describe('Home (dashboard) page', () => {
  it('shows the Home toolbar with the quick actions', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText(/· Week \d+/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new follow-up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log activity/i })).toBeInTheDocument();
  });

  it('shows the key figures strip', () => {
    render(<DashboardPage />);
    const strip = screen.getByRole('region', { name: 'Key figures' });
    for (const label of ['Open pipeline', 'Lifetime ARR', 'Win rate · 90 days', 'Follow-ups due today']) {
      expect(within(strip).getByText(label)).toBeInTheDocument();
    }
  });

  it('shows all home panels', () => {
    render(<DashboardPage />);
    for (const title of ['Due today', 'Recent activity', 'This week', 'Deals going quiet', 'Open pipeline by stage']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it('shows friendly empty states when there is no data', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Nothing overdue')).toBeInTheDocument();
    expect(screen.getByText('Nothing due today')).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('No deals going quiet')).toBeInTheDocument();
  });
});

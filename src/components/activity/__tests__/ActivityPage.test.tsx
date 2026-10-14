import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'next/navigation';
import { ActivityPage } from '../ActivityPage';
import { useFollowUpStore } from '@/store/followUpStore';

beforeEach(() => {
  vi.mocked(useRouter().push).mockClear();
  useFollowUpStore.setState({ overdueCount: 2 });
});

describe('ActivityPage', () => {
  it('shows the Activity toolbar with both views and the overdue count', () => {
    render(<ActivityPage mode="timeline" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Timeline' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Your Follow-Ups\s*2/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Log activity/ })).toBeInTheDocument();
  });

  it('switches to Your Follow-Ups', () => {
    render(<ActivityPage mode="timeline" />);
    fireEvent.click(screen.getByRole('button', { name: /Your Follow-Ups/ }));
    expect(useRouter().push).toHaveBeenCalledWith('/followups');
  });

  it('searches rather than filters, with a matching placeholder per view', () => {
    const { rerender } = render(<ActivityPage mode="timeline" />);
    expect(screen.getByPlaceholderText('Search timeline…')).toBeInTheDocument();
    rerender(<ActivityPage mode="followups" />);
    expect(screen.getByPlaceholderText('Search follow-ups…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New follow-up/ })).toBeInTheDocument();
  });

  it('shows an empty state when there is nothing yet', () => {
    render(<ActivityPage mode="timeline" />);
    expect(screen.getByText('No events in the timeline yet')).toBeInTheDocument();
  });
});

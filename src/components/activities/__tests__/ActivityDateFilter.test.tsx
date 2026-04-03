import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityDateFilter } from '../ActivityDateFilter';

describe('ActivityDateFilter', () => {
  it('renders with default "Last 3 months" preset selected', () => {
    render(<ActivityDateFilter onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Last 3 months');
  });

  it('calls onChange with date range when preset changes', () => {
    const onChange = vi.fn();
    render(<ActivityDateFilter onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.any(String), to: expect.any(String) })
    );
  });

  it('calls onChange with null for "All time"', () => {
    const onChange = vi.fn();
    render(<ActivityDateFilter onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('All time'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompactPager } from '../compact-pager';

describe('CompactPager', () => {
  it('renders nothing when everything fits on one page', () => {
    const { container } = render(<CompactPager page={1} pageSize={10} total={8} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the visible range and page position', () => {
    render(<CompactPager page={2} pageSize={10} total={63} onPageChange={() => {}} />);
    expect(screen.getByText('11–20 of 63')).toBeInTheDocument();
    expect(screen.getByText('2 / 7')).toBeInTheDocument();
  });

  it('pages back and forward within bounds', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<CompactPager page={1} pageSize={10} total={25} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    rerender(<CompactPager page={3} pageSize={10} total={25} onPageChange={onPageChange} />);
    expect(screen.getByText('21–25 of 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});

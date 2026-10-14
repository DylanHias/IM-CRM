import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActivityTypePicker } from '../ActivityTypePicker';

describe('ActivityTypePicker', () => {
  it('shows the four types with the current one pressed', () => {
    render(<ActivityTypePicker value="call" onChange={() => {}} />);
    const group = screen.getByRole('group', { name: 'Activity type' });
    expect(group).toBeInTheDocument();
    for (const label of ['Meeting', 'Visit', 'Call', 'Note']) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', String(label === 'Call'));
    }
  });

  it('reports the picked type', () => {
    const onChange = vi.fn();
    render(<ActivityTypePicker value="meeting" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Note' }));
    expect(onChange).toHaveBeenCalledWith('note');
  });
});

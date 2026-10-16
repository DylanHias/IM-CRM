import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportTile } from '../ReportTile';

describe('ReportTile', () => {
  it('shows the value and the population caption', () => {
    render(<ReportTile label="ARR today" value="€1.2M" caption="all Benelux accounts" />);
    expect(screen.getByText('€1.2M')).toBeInTheDocument();
    expect(screen.getByText('all Benelux accounts')).toBeInTheDocument();
  });

  it('shows a named empty state instead of a value when a tile has no data', () => {
    const { container } = render(<ReportTile label="ARR today" caption="all Benelux accounts" empty="No matching Power BI record" />);
    expect(screen.getByText('No matching Power BI record')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/\d/);
    expect(screen.getByText('all Benelux accounts')).toBeInTheDocument();
  });

  it('treats an empty string as no empty state', () => {
    // @ts-expect-error value and empty are mutually exclusive by type; this guards the runtime
    render(<ReportTile label="ARR today" value="€5K" caption="x" empty="" />);
    expect(screen.getByText('€5K')).toBeInTheDocument();
  });
});

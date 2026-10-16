import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportTile } from '../ReportTile';

describe('ReportTile', () => {
  it('shows the value and the population caption', () => {
    render(<ReportTile label="ARR today" value="€1.2M" caption="all Benelux accounts" />);
    expect(screen.getByText('€1.2M')).toBeInTheDocument();
    expect(screen.getByText('all Benelux accounts')).toBeInTheDocument();
  });

  it('shows a named empty state instead of a zero when a tile has no data', () => {
    render(<ReportTile label="ARR today" caption="all Benelux accounts" empty="No matching Power BI record" />);
    expect(screen.getByText('No matching Power BI record')).toBeInTheDocument();
    expect(screen.queryByText('€0')).not.toBeInTheDocument();
    expect(screen.getByText('all Benelux accounts')).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ColumnPicker, useColumnConfig } from '../ColumnPicker';
import type { ColumnDef } from '../ColumnPicker';
import { useSettingsStore } from '@/store/settingsStore';

const TEST_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
];

beforeEach(() => {
  useSettingsStore.setState({ tableColumns: {} });
});

describe('useColumnConfig', () => {
  it('returns all columns visible by default', () => {
    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    expect(result.current.visibleColumns).toEqual(['name', 'email', 'phone']);
    expect(result.current.orderedColumns).toEqual(['name', 'email', 'phone']);
    expect(result.current.hidden.size).toBe(0);
  });

  it('hides a column when toggled', () => {
    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    act(() => {
      result.current.toggleColumn('email');
    });

    expect(result.current.visibleColumns).toEqual(['name', 'phone']);
    expect(result.current.hidden.has('email')).toBe(true);
  });

  it('shows a hidden column when toggled again', () => {
    useSettingsStore.setState({
      tableColumns: { test: { order: ['name', 'email', 'phone'], hidden: ['email'] } },
    });

    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));
    expect(result.current.visibleColumns).toEqual(['name', 'phone']);

    act(() => {
      result.current.toggleColumn('email');
    });

    expect(result.current.visibleColumns).toEqual(['name', 'email', 'phone']);
  });

  it('reorders columns', () => {
    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    act(() => {
      result.current.reorder(0, 2);
    });

    expect(result.current.orderedColumns).toEqual(['email', 'phone', 'name']);
    expect(result.current.visibleColumns).toEqual(['email', 'phone', 'name']);
  });

  it('resets to defaults', () => {
    useSettingsStore.setState({
      tableColumns: { test: { order: ['phone', 'name', 'email'], hidden: ['email'] } },
    });

    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));
    expect(result.current.visibleColumns).toEqual(['phone', 'name']);

    act(() => {
      result.current.reset();
    });

    expect(result.current.visibleColumns).toEqual(['name', 'email', 'phone']);
    expect(result.current.hidden.size).toBe(0);
  });

  it('appends new columns not in saved order', () => {
    useSettingsStore.setState({
      tableColumns: { test: { order: ['name', 'email'], hidden: [] } },
    });

    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    expect(result.current.orderedColumns).toEqual(['name', 'email', 'phone']);
  });

  it('removes stale columns from saved order', () => {
    useSettingsStore.setState({
      tableColumns: { test: { order: ['name', 'deleted_col', 'email', 'phone'], hidden: [] } },
    });

    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    expect(result.current.orderedColumns).toEqual(['name', 'email', 'phone']);
  });

  it('persists changes to settings store', () => {
    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    act(() => {
      result.current.toggleColumn('phone');
    });

    const stored = useSettingsStore.getState().tableColumns;
    expect(stored.test).toEqual({
      order: ['name', 'email', 'phone'],
      hidden: ['phone'],
    });
  });

  it('does not affect other table keys when updating', () => {
    useSettingsStore.setState({
      tableColumns: { other: { order: ['a', 'b'], hidden: ['a'] } },
    });

    const { result } = renderHook(() => useColumnConfig('test', TEST_COLUMNS));

    act(() => {
      result.current.toggleColumn('email');
    });

    const stored = useSettingsStore.getState().tableColumns;
    expect(stored.other).toEqual({ order: ['a', 'b'], hidden: ['a'] });
    expect(stored.test.hidden).toEqual(['email']);
  });
});

describe('ColumnPicker', () => {
  it('renders trigger button', () => {
    render(<ColumnPicker tableKey="test" columns={TEST_COLUMNS} />);
    expect(screen.getByRole('button', { name: /columns/i })).toBeInTheDocument();
  });

  it('shows column names in popover when clicked', async () => {
    render(<ColumnPicker tableKey="test" columns={TEST_COLUMNS} />);

    await userEvent.click(screen.getByRole('button', { name: /columns/i }));

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });
  });

  it('toggles column visibility when checkbox is clicked', async () => {
    render(<ColumnPicker tableKey="test" columns={TEST_COLUMNS} />);

    await userEvent.click(screen.getByRole('button', { name: /columns/i }));

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[1]); // Email checkbox

    const stored = useSettingsStore.getState().tableColumns;
    expect(stored.test.hidden).toContain('email');
  });
});

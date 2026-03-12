export const theme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    sidebar: {
      bg: '#1a2234',
      fg: '#cbd5e1',
      active: '#3b82f6',
      hover: '#243044',
      border: '#243044',
    },
    status: {
      pending: '#f59e0b',
      synced: '#22c55e',
      error: '#ef4444',
      overdue: '#ef4444',
    },
    activity: {
      meeting: '#8b5cf6',
      visit: '#06b6d4',
      call: '#22c55e',
      note: '#f59e0b',
    },
  },
  spacing: {
    sidebar: '240px',
    topbar: '56px',
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
  },
} as const;

export type Theme = typeof theme;

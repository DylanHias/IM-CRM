export const lightTheme = {
  colors: {
    primary: '#1570ef',
    primaryDark: '#1260d4',
    sidebar: {
      bg: 'hsl(var(--sidebar-bg))',
      fg: 'hsl(var(--sidebar-fg))',
      activeBg: 'hsl(var(--sidebar-active-bg))',
      activeFg: 'hsl(var(--sidebar-active-fg))',
      hover: 'hsl(var(--sidebar-hover-bg))',
      border: 'hsl(var(--sidebar-border))',
    },
    topbar: {
      bg: 'hsl(var(--topbar-bg))',
      border: 'hsl(var(--topbar-border))',
    },
    status: {
      pending: 'hsl(var(--warning))',
      synced: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      overdue: 'hsl(var(--destructive))',
    },
    activity: {
      meeting: 'hsl(var(--activity-meeting))',
      visit: 'hsl(var(--activity-visit))',
      call: 'hsl(var(--activity-call))',
      note: 'hsl(var(--activity-note))',
    },
  },
  spacing: {
    sidebar: '220px',
    topbar: '60px',
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    cardHover: '0 4px 12px 0 rgb(0 0 0 / 0.1), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
} as const;

export const darkTheme = {
  ...lightTheme,
} as const;

// Default export for backwards compat
export const theme = lightTheme;

export type Theme = typeof lightTheme;

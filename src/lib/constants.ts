// Navigation sections for Alex AI sidebar
export const NAV_SECTIONS = [
  {
    label: 'ANALYTICS',
    items: [
      { name: 'Overview', path: '/dashboard', icon: 'LayoutDashboard' },
      { name: 'Call Analytics', path: '/dashboard/call-analytics', icon: 'PhoneCall' },
      { name: 'Lead Pipeline', path: '/dashboard/leads', icon: 'TrendingUp' },
      { name: 'Appointments', path: '/dashboard/appointments', icon: 'CalendarCheck' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Live Monitor', path: '/dashboard/monitor', icon: 'Radio' },
      { name: 'Call History', path: '/dashboard/calls', icon: 'History' },
    ],
  },
] as const;

// Flat nav items for backward compat
export const NAV_ITEMS = NAV_SECTIONS.flatMap(s => [...s.items]);

// Role permissions
export const ROLE_PERMISSIONS = {
  OWNER: ['view', 'edit', 'delete', 'manage_team', 'manage_billing', 'manage_integrations'],
  ADMIN: ['view', 'edit', 'delete', 'manage_team', 'manage_integrations'],
  AGENT: ['view', 'edit'],
  VIEWER: ['view'],
} as const;

// Outcome colors for charts
export const OUTCOME_COLORS: Record<string, string> = {
  booked: 'hsl(160, 84%, 39%)',
  qualified: 'hsl(217, 91%, 60%)',
  not_qualified: 'hsl(38, 92%, 50%)',
  other: 'hsl(215, 16%, 47%)',
};

// Status badge styles
export const STATUS_BADGE_STYLES: Record<string, string> = {
  booked: 'bg-primary/10 text-primary',
  rescheduled: 'bg-warning/10 text-warning',
  cancelled: 'bg-destructive/10 text-destructive',
  SCHEDULED: 'bg-info/10 text-info',
  COMPLETED: 'bg-primary/10 text-primary',
  CANCELLED: 'bg-destructive/10 text-destructive',
  NO_SHOW: 'bg-warning/10 text-warning',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: 'hsl(215, 16%, 47%)',
  CONTACTED: 'hsl(217, 91%, 60%)',
  QUALIFIED: 'hsl(160, 84%, 39%)',
  UNQUALIFIED: 'hsl(0, 84%, 60%)',
  APPOINTMENT_SCHEDULED: 'hsl(38, 92%, 50%)',
  APPOINTMENT_COMPLETED: 'hsl(43, 66%, 52%)',
  CLOSED_WON: 'hsl(152, 90%, 30%)',
  CLOSED_LOST: 'hsl(0, 62%, 50%)',
};

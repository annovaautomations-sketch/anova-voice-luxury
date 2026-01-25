// Navigation items for the sidebar
export const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Calls', path: '/dashboard/calls', icon: 'Phone' },
  { name: 'Assistants', path: '/dashboard/assistants', icon: 'Bot' },
  { name: 'Numbers', path: '/dashboard/numbers', icon: 'Hash' },
  { name: 'Appointments', path: '/dashboard/appointments', icon: 'Calendar' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: 'BarChart3' },
  { name: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
] as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  OWNER: ['view', 'edit', 'delete', 'manage_team', 'manage_billing', 'manage_integrations'],
  ADMIN: ['view', 'edit', 'delete', 'manage_team', 'manage_integrations'],
  AGENT: ['view', 'edit'],
  VIEWER: ['view'],
} as const;

// Integration providers
export const INTEGRATION_PROVIDERS = {
  vapi: {
    name: 'Vapi',
    description: 'AI voice agents for phone calls',
    icon: 'Phone',
    color: 'emerald',
  },
  google_calendar: {
    name: 'Google Calendar',
    description: 'Sync appointments and bookings',
    icon: 'Calendar',
    color: 'blue',
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models for conversation',
    icon: 'Brain',
    color: 'purple',
  },
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Natural voice synthesis',
    icon: 'Volume2',
    color: 'pink',
  },
  twilio: {
    name: 'Twilio',
    description: 'Phone number provisioning',
    icon: 'PhoneCall',
    color: 'red',
  },
} as const;

// Call outcome colors
export const OUTCOME_COLORS = {
  booked: 'text-primary',
  qualified: 'text-info',
  not_qualified: 'text-warning',
  other: 'text-muted-foreground',
} as const;

// Call status colors
export const STATUS_COLORS = {
  queued: 'text-muted-foreground',
  ringing: 'text-warning',
  'in-progress': 'text-info',
  forwarding: 'text-info',
  ended: 'text-foreground',
} as const;

// Appointment status colors
export const APPOINTMENT_STATUS_COLORS = {
  booked: 'text-primary',
  rescheduled: 'text-warning',
  cancelled: 'text-destructive',
} as const;

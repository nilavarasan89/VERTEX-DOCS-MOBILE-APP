/**
 * Vertex Docs Mobile - Design System & Theme
 * JM Vertex Technologies
 */

export const COLORS = {
  // Brand Palette (Specification exact values)
  primary: '#2563EB',       // Primary blue
  navy: '#0B1533',          // Dark navy
  background: '#F8FAFC',    // Soft off-white background
  surface: '#FFFFFF',       // Card / modal surface
  card: '#FFFFFF',          // Card background surface
  teal: '#0EA5A4',          // Teal accent
  textPrimary: '#172033',   // Main text
  textSecondary: '#64748B', // Secondary text
  border: '#D9E2EF',        // Form borders and dividers

  // Supporting & Semantic Colors
  borderLight: '#EDF2F7',
  borderFocus: '#2563EB',
  inputBackground: '#FFFFFF',
  
  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorBorder: '#FCA5A5',

  success: '#10B981',
  successLight: '#ECFDF5',
  successBorder: '#6EE7B7',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  muted: '#94A3B8',
  iconColor: '#64748B',
  iconActive: '#2563EB',

  // Interactive States
  primaryHover: '#1D4ED8',
  primaryActive: '#1E40AF',
  primarySoft: '#EFF6FF',
  tealSoft: '#E6FFFA',
  navySoft: '#16234D',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  modal: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  glowPrimary: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    color: COLORS.navy,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: COLORS.navy,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: '#FFFFFF',
  },
};

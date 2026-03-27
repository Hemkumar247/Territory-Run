export const colors = {
  background: {
    dark: '#080B12',
    surface: '#0D1117',
    card: 'rgba(255, 255, 255, 0.04)',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    heavy: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderBright: 'rgba(255, 255, 255, 0.22)',
  },
  neon: {
    primary: '#00E5FF',
    secondary: '#7B2FFF',
    accent: '#FF3CAC',
    success: '#00FF88',
    warning: '#FFB800',
  },
  text: {
    primary: '#F0F4FF',
    secondary: 'rgba(240, 244, 255, 0.55)',
    tertiary: 'rgba(240, 244, 255, 0.30)',
    disabled: 'rgba(240, 244, 255, 0.18)',
  },
  users: [
    '#00E5FF', // Cyan
    '#8B5CF6', // Violet
    '#FF6B6B', // Coral
    '#00FF88', // Mint
    '#FF9500', // Orange
    '#FF3CAC', // Pink
    '#38BDF8', // Sky
    '#A3E635', // Lime
  ]
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  full: '9999px',
};

export const typography = {
  fonts: {
    primary: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    display: "'Space Grotesk', system-ui, sans-serif",
  },
  sizes: {
    display: { fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px' },
    h1: { fontSize: '24px', fontWeight: 600, letterSpacing: '-0.3px' },
    h2: { fontSize: '18px', fontWeight: 600, letterSpacing: '-0.2px' },
    h3: { fontSize: '15px', fontWeight: 500, letterSpacing: '0px' },
    body: { fontSize: '14px', fontWeight: 400, lineHeight: 1.6 },
    caption: { fontSize: '12px', fontWeight: 400, color: colors.text.secondary },
    monoStat: { fontSize: '28px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
    micro: { fontSize: '11px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
  }
};

export const shadows = {
  glassBase: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
  glassElevated: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
  neonActive: '0 0 20px rgba(0, 229, 255, 0.15), 0 0 60px rgba(0, 229, 255, 0.05), inset 0 1px 0 rgba(0, 229, 255, 0.20)',
  liquidButton: '0 0 24px rgba(0, 229, 255, 0.20), 0 4px 16px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
};

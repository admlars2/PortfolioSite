export type ThemeName = 'light' | 'dark';

export type ThemeTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  sidebar: string;
  sidebarBorder: string;
  switchTrack: string;
  switchThumb: string;
  heroOverlay: string;
  /** Hero contrast gradient (rgba) — top-left to transparent */
  heroGradientFrom: string;
  heroGradientVia: string;
};

export const themeTokens: Record<ThemeName, ThemeTokens> = {
  light: {
    // Nebula light theme - airy lilac surfaces with crimson accents
    background: '#f3eefb',
    surface: '#fbf8ff',
    surfaceMuted: '#efe7fb',
    card: '#ffffff',
    text: '#221734',
    textMuted: '#5c4a75',
    border: '#d5c6e9',
    accent: '#9b1c48',
    accentHover: '#7f153b',
    accentContrast: '#fff7fb',
    sidebar: '#f8f3ff',
    sidebarBorder: '#d9caed',
    switchTrack: '#d8c9eb',
    switchThumb: '#ffffff',
    heroOverlay: '#0f0a1d',
    heroGradientFrom: 'rgba(121, 33, 76, 0.72)',
    heroGradientVia: 'rgba(79, 49, 145, 0.45)',
  },
  dark: {
    // Nebula dark theme - deep plum surfaces with crimson accents
    background: '#140f24',
    surface: '#1c1630',
    surfaceMuted: '#261d42',
    card: '#2e2450',
    text: '#f6f1ff',
    textMuted: '#c9bbdf',
    border: '#4a3970',
    accent: '#c12659',
    accentHover: '#9e1e49',
    accentContrast: '#fff7fb',
    sidebar: '#1a1430',
    sidebarBorder: '#3a2d5f',
    switchTrack: '#3a2d5f',
    switchThumb: '#c12659',
    heroOverlay: '#110a20',
    heroGradientFrom: 'rgba(108, 26, 80, 0.76)',
    heroGradientVia: 'rgba(66, 38, 126, 0.48)',
  },
};


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
    // Botanical light theme - soft sage greens and natural tones
    background: '#CAD5CA', // Soft sage green background
    surface: '#f8fcf8', // Very light green-white for cards
    surfaceMuted: '#e8f0e8', // Muted sage for sections
    card: '#ffffff', // Pure white cards for contrast
    text: '#1a2a1f', // Deep forest green text
    textMuted: '#4a5c4f', // Muted green-gray text
    border: '#b8c5b8', // Sage green borders
    accent: '#3C6E71', // Teal accent (from your example)
    accentHover: '#2d5558', // Darker teal on hover
    accentContrast: '#ffffff', // White text on accent
    sidebar: '#f8fcf8', // Light green-white sidebar
    sidebarBorder: '#b8c5b8', // Sage border
    switchTrack: '#a5bec0', // Soft teal track
    switchThumb: '#ffffff', // White thumb
    // Hero intentionally matches dark-mode space palette
    heroOverlay: '#152018',
    heroGradientFrom: 'rgba(13, 27, 15, 0.82)',
    heroGradientVia: 'rgba(21, 32, 24, 0.48)',
  },
  dark: {
    // Nighttime botanical theme - deep forest greens and emerald accents
    background: '#0d1b0f', // Deep forest green background
    surface: '#152018', // Slightly lighter forest for surfaces
    surfaceMuted: '#1a2a1f', // Muted dark green for sections
    card: '#1f2e23', // Dark emerald card background
    text: '#e8f5e9', // Soft green-white text
    textMuted: '#a8c5ab', // Muted moss green text
    border: '#2d4a35', // Dark moss border
    accent: '#10b981', // Emerald accent
    accentHover: '#059669', // Darker emerald on hover
    accentContrast: '#0d1b0f', // Dark text on accent
    sidebar: '#152018', // Dark forest sidebar
    sidebarBorder: '#1f2e23', // Dark emerald border
    switchTrack: '#1f2e23', // Dark emerald track
    switchThumb: '#10b981', // Emerald thumb
    heroOverlay: '#152018', // Dark forest overlay
    heroGradientFrom: 'rgba(13, 27, 15, 0.82)',
    heroGradientVia: 'rgba(21, 32, 24, 0.48)',
  },
};


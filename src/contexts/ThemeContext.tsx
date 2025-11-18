import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { themeTokens } from '@/theme/tokens';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  // Read from HTML class (already set by inline script in index.html)
  const htmlClass = document.documentElement.classList.contains('dark') ? 'dark' : 
                    document.documentElement.classList.contains('light') ? 'light' : null;
  return htmlClass || 'light';
}

function toCssVariableName(tokenKey: string) {
  return `--color-${tokenKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  const tokens = themeTokens[theme];
  Object.entries(tokens).forEach(([tokenKey, value]) => {
    root.style.setProperty(toCssVariableName(tokenKey), value);
  });

  localStorage.setItem('theme', theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    return initial;
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
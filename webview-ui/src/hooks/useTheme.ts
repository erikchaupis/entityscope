import { useEffect } from 'react';
import type { AppTheme } from '@/types';

export const THEMES: AppTheme[] = ['light', 'dark', 'graphite'];

export const THEME_LABELS: Record<AppTheme, string> = {
  light: 'Light',
  dark: 'Dark',
  graphite: 'Graphite',
};

export const DEFAULT_THEME: AppTheme = 'light';

export function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme(theme: AppTheme) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}

export function nextTheme(current: AppTheme): AppTheme {
  const index = THEMES.indexOf(current);
  return THEMES[(index + 1) % THEMES.length];
}

export function themeFromColorKind(_kind: number): AppTheme {
  return DEFAULT_THEME;
}

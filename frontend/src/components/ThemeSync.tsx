import { useLayoutEffect } from 'react';

import { useThemeStore } from '../store/useThemeStore';

/** Aplica `data-theme` em `<html>` para tokens CSS em `index.css` (todas as rotas). */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.dataset.theme = 'dark';
    } else {
      delete root.dataset.theme;
    }
  }, [theme]);

  return null;
}

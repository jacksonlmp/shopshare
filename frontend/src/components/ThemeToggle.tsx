import { useThemeStore } from '../store/useThemeStore';

const baseClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary/45 hover:bg-primary-container/20 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

type ThemeToggleProps = {
  /** Rótulo para leitores de ecrã (ex.: "Alternar tema") */
  label?: string;
  className?: string;
};

/**
 * Ícone: em modo claro mostra `dark_mode` (clique → escuro); em modo escuro mostra `light_mode`.
 */
export function ThemeToggle({ label = 'Alternar entre tema claro e escuro', className }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const icon = theme === 'dark' ? 'light_mode' : 'dark_mode';

  return (
    <button
      type="button"
      className={className ? `${baseClass} ${className}` : baseClass}
      onClick={() => toggleTheme()}
      aria-label={label}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden>
        {icon}
      </span>
    </button>
  );
}

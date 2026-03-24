import { Link, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '../components/ThemeToggle';
import { clearStoredUser } from '../services/storage';
import { useSessionStore } from '../store/useSessionStore';

export function HomePage() {
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const navigate = useNavigate();

  function handleLogout(): void {
    clearStoredUser();
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <div className="page-ethereal home-page">
      <div className="page-ethereal-inner">
        <div className="mb-4 flex w-full items-start justify-between gap-3">
          <p className="ethereal-muted mb-0">
            <Link to="/" className="ethereal-link">
              ← Voltar ao site
            </Link>
          </p>
          <ThemeToggle className="shrink-0" />
        </div>
        <h1 className="ethereal-title">Início</h1>
        <p className="ethereal-subtitle !text-on-surface">
          Sessão: {user?.avatarEmoji} {user?.displayName}
        </p>
        <p className="ethereal-muted">
          Próximo passo: listas e itens (ver roadmap).
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 self-start font-body text-sm font-semibold text-on-surface-variant underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

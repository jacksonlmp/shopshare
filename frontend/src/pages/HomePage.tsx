import { Link } from 'react-router-dom';

import { ThemeToggle } from '../components/ThemeToggle';
import { useSessionStore } from '../store/useSessionStore';

export function HomePage() {
  const user = useSessionStore((s) => s.user);

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
      </div>
    </div>
  );
}

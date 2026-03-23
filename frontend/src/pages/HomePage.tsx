import { useSessionStore } from '../store/useSessionStore';
import { colors } from '../theme/colors';

export function HomePage() {
  const user = useSessionStore((s) => s.user);

  return (
    <div className="page home-page">
      <div className="page-inner">
        <h1 className="title" style={{ color: colors.textPrimary }}>
          Home
        </h1>
        <p className="subtitle" style={{ color: colors.textPrimary }}>
          Signed in as {user?.avatarEmoji} {user?.displayName}
        </p>
        <p className="muted" style={{ color: colors.textSecondary }}>
          Next step: your shopping lists and items (see roadmap).
        </p>
      </div>
    </div>
  );
}

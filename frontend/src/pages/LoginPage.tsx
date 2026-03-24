import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../api/client';
import { saveStoredUser } from '../services/storage';
import { useSessionStore } from '../store/useSessionStore';

/** Avatares — alinhado ao grid Stitch (5 colunas). */
const AVATAR_EMOJIS = ['😊', '🦊', '🐼', '🥑', '🚀', '😎', '🐱', '👾', '🦄', '🛒'] as const;

export function LoginPage() {
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState<string>('😎');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setUser = useSessionStore((s) => s.setUser);
  const navigate = useNavigate();

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Indique o seu apelido.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await api.post('/api/users/', {
        display_name: trimmed,
        avatar_emoji: avatarEmoji,
      });

      const user = {
        userId: response.data.id as string,
        displayName: response.data.display_name as string,
        avatarEmoji: response.data.avatar_emoji as string,
      };

      saveStoredUser(user);
      setUser(user);
      navigate('/home', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const details = status ? `HTTP ${status}` : err.message;
        setError(`Não foi possível iniciar sessão. ${details}`);
        return;
      }
      setError('Não foi possível iniciar sessão.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface antialiased">
      <div className="mx-auto flex w-full max-w-lg items-start justify-between gap-3 px-4 pt-4 sm:px-6">
        <p className="mb-0 text-sm text-on-surface-variant">
          <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            ← Voltar ao site
          </Link>
        </p>
        <ThemeToggle className="shrink-0" />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg">
          {/* Hero — âncora visual (referência Stitch / ícone cesto) */}
          <div className="mb-10 text-center">
            <div className="relative inline-block">
              <div
                className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-3xl"
                aria-hidden
              />
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-container-low shadow-ambient">
                <span className="material-symbols-outlined text-5xl text-primary" aria-hidden>
                  shopping_basket
                </span>
              </div>
            </div>
            <h1 className="font-headline mb-3 text-4xl font-extrabold tracking-tight text-on-surface">
              Bem-vindo ao ShopShare!
            </h1>
            <p className="mx-auto max-w-sm text-lg leading-relaxed text-on-surface-variant">
              Organize suas compras em família ou com amigos em tempo real.
            </p>
          </div>

          {/* Cartão — nome + avatar */}
          <div className="rounded-[1rem] border border-outline-variant/25 bg-surface-container-lowest p-8 shadow-ambient md:rounded-[1.25rem]">
            <form className="space-y-8" onSubmit={(e) => void submit(e)} noValidate>
              <div className="space-y-3">
                <label
                  className="ml-1 block text-sm font-semibold text-on-surface-variant"
                  htmlFor="login-nickname"
                >
                  Seu apelido
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                    aria-hidden
                  >
                    person
                  </span>
                  <input
                    id="login-nickname"
                    className="w-full rounded-lg border border-transparent bg-surface-container-low py-4 pl-12 pr-4 font-body text-on-surface shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-outline-variant)_18%,transparent)] transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    autoComplete="nickname"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="ml-1 text-sm font-semibold text-on-surface-variant">Escolha seu avatar</p>
                <div
                  className="grid grid-cols-5 gap-3"
                  role="group"
                  aria-label="Escolher emoji de avatar"
                >
                  {AVATAR_EMOJIS.map((emoji) => {
                    const selected = avatarEmoji === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        className={`flex aspect-square items-center justify-center rounded-lg text-3xl transition-all hover:bg-primary-container hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 ${
                          selected
                            ? 'bg-surface-container-high ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest'
                            : 'bg-surface-container ring-2 ring-transparent'
                        }`}
                        onClick={() => setAvatarEmoji(emoji)}
                        aria-pressed={selected}
                      >
                        <span className="leading-none">{emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-[color-mix(in_srgb,var(--color-error-container)_12%,transparent)] px-3 py-2 text-sm font-medium text-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary-jewel group flex w-full items-center justify-center gap-2 py-5 text-base disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span>{submitting ? 'A entrar…' : 'Continuar'}</span>
                {!submitting ? (
                  <span
                    className="material-symbols-outlined transition-transform group-hover:translate-x-1"
                    aria-hidden
                  >
                    arrow_forward
                  </span>
                ) : null}
              </button>
            </form>
          </div>

          {/* Benefícios — ícones preenchidos */}
          <div className="mt-12 flex justify-center gap-8 text-on-surface-variant/70">
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                group
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Colaborativo</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                sync
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Tempo real</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                verified_user
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Seguro</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full rounded-t-[2.5rem] border-t border-outline-variant/20 bg-surface-container-low">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <span className="font-headline text-lg font-bold text-on-surface">ShopShare</span>
            <p className="text-center text-sm text-on-surface-variant md:text-left">
              © {new Date().getFullYear()} ShopShare. Todos os direitos reservados.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6" aria-label="Rodapé">
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary hover:underline">
              Privacidade
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary hover:underline">
              Termos
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary hover:underline">
              Ajuda
            </a>
            <Link to="/" className="text-sm text-on-surface-variant transition-colors hover:text-primary hover:underline">
              Site
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

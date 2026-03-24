import axios from 'axios';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';
import { clearStoredUser } from '../services/storage';
import { useSessionStore } from '../store/useSessionStore';
import type { ShoppingListDetailDto, ShoppingListSummaryDto } from '../types/lists';

function navClass(active: boolean): string {
  return `font-headline text-sm font-bold tracking-tight transition-colors sm:text-base ${
    active
      ? 'border-b-2 border-primary pb-1 text-primary'
      : 'text-on-surface-variant hover:text-primary'
  }`;
}

export function HomePage() {
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const navigate = useNavigate();

  const [summaries, setSummaries] = useState<ShoppingListSummaryDto[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, ShoppingListDetailDto>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const joinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadLists = useCallback(async () => {
    setLoadError(null);
    try {
      const { data } = await api.get<ShoppingListSummaryDto[]>('/api/lists/');
      setSummaries(data);
      const active = data.filter((l) => !l.is_archived).slice(0, 12);
      const detailEntries = await Promise.allSettled(
        active.map((l) => api.get<ShoppingListDetailDto>(`/api/lists/${l.id}/`).then((r) => r.data)),
      );
      const map: Record<string, ShoppingListDetailDto> = {};
      detailEntries.forEach((result) => {
        if (result.status === 'fulfilled') {
          const d = result.value;
          map[d.id] = d;
        }
      });
      setDetailsById(map);
    } catch {
      setLoadError('Não foi possível carregar as suas listas.');
      setSummaries([]);
      setDetailsById({});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadLists();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLists]);

  useEffect(() => {
    if (!joinOpen) return;
    const id = requestAnimationFrame(() => {
      joinInputRefs.current[0]?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [joinOpen]);

  const activeLists = useMemo(
    () => summaries.filter((l) => !l.is_archived),
    [summaries],
  );
  const archivedCount = useMemo(
    () => summaries.filter((l) => l.is_archived).length,
    [summaries],
  );

  const insights = useMemo(() => {
    const details = Object.values(detailsById);
    if (details.length === 0) return { mostActive: null as string | null, suggestion: null as string | null };
    let most = details[0];
    for (const d of details) {
      if (d.items.length > most.items.length) most = d;
    }
    const churras = details.find((d) => /churras/i.test(d.name));
    const unchecked = churras?.items.filter((i) => !i.is_checked).length ?? 0;
    return {
      mostActive: most.items.length > 0 ? most.name : null,
      suggestion:
        churras && unchecked > 0
          ? `${unchecked} item(ns) por marcar em «${churras.name}»`
          : details.some((d) => d.items.some((i) => !i.is_checked))
            ? 'Marque itens concluídos nas suas listas'
            : null,
    };
  }, [detailsById]);

  function handleLogout(): void {
    clearStoredUser();
    setUser(null);
    navigate('/login', { replace: true });
  }

  async function handleCreateList(e: FormEvent): Promise<void> {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      setActionError('Indique um nome para a lista.');
      return;
    }
    setActionError(null);
    setCreateBusy(true);
    try {
      const payload: { name: string; description?: string } = { name };
      const desc = createDescription.trim();
      if (desc) {
        payload.description = desc;
      }
      await api.post('/api/lists/', payload);
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      await loadLists();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.detail || 'Não foi possível criar a lista.');
      } else {
        setActionError('Não foi possível criar a lista.');
      }
    } finally {
      setCreateBusy(false);
    }
  }

  const focusJoinSlot = useCallback((index: number) => {
    joinInputRefs.current[Math.max(0, Math.min(5, index))]?.focus();
  }, []);

  const handleJoinSlotChange = useCallback(
    (index: number, raw: string) => {
      const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const char = cleaned.length === 0 ? '' : cleaned.slice(-1);
      setJoinCode((prev) => {
        const slots = Array.from({ length: 6 }, (_, j) => prev[j] ?? '');
        slots[index] = char;
        const next = slots.join('');
        if (char && index < 5) {
          queueMicrotask(() => focusJoinSlot(index + 1));
        }
        return next;
      });
    },
    [focusJoinSlot],
  );

  const handleJoinSlotKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
        e.preventDefault();
        setJoinCode((prev) => {
          const slots = Array.from({ length: 6 }, (_, j) => prev[j] ?? '');
          slots[index - 1] = '';
          return slots.join('');
        });
        queueMicrotask(() => focusJoinSlot(index - 1));
        return;
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusJoinSlot(index - 1);
      }
      if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        focusJoinSlot(index + 1);
      }
    },
    [focusJoinSlot],
  );

  const handleJoinPaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData
        .getData('text')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);
      setJoinCode(text);
      queueMicrotask(() => focusJoinSlot(Math.min(text.length, 5)));
    },
    [focusJoinSlot],
  );

  async function handleJoinList(e: FormEvent): Promise<void> {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setActionError('Preencha os 6 caracteres do código.');
      return;
    }
    setActionError(null);
    setJoinBusy(true);
    try {
      await api.post('/api/lists/join/', { share_code: code });
      setJoinOpen(false);
      setJoinCode('');
      await loadLists();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data;
        const msg =
          typeof d?.detail === 'string'
            ? d.detail
            : Array.isArray(d?.detail)
              ? d.detail.map((x: { msg?: string }) => x.msg).join(' ')
              : 'Código inválido ou lista indisponível.';
        setActionError(msg);
      } else {
        setActionError('Não foi possível entrar na lista.');
      }
    } finally {
      setJoinBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface antialiased">
      <header className="glass-nav fixed top-0 z-50 w-full">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-8">
          <div className="min-w-0 flex-1">
            <Link
              to="/"
              className="font-headline text-lg font-extrabold tracking-tight text-primary sm:text-xl"
            >
              ShopShare
            </Link>
          </div>

          <nav
            className="hidden flex-1 items-center justify-center gap-6 md:flex lg:gap-8"
            aria-label="Principal"
          >
            <NavLink to="/home" end className={({ isActive }) => navClass(isActive)}>
              Painel
            </NavLink>
            <span
              className="cursor-not-allowed font-headline text-sm font-bold tracking-tight text-on-surface-variant/50 sm:text-base"
              title="Em breve"
            >
              Coleções
            </span>
            <span
              className="cursor-not-allowed font-headline text-sm font-bold tracking-tight text-on-surface-variant/50 sm:text-base"
              title="Em breve"
            >
              Mercado
            </span>
            <span
              className="cursor-not-allowed font-headline text-sm font-bold tracking-tight text-on-surface-variant/50 sm:text-base"
              title="Em breve"
            >
              Perfil
            </span>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-surface-container-low/80"
              aria-label="Notificações"
              title="Em breve"
            >
              <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>
                notifications
              </span>
            </button>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-surface-container-low/80"
              aria-label="Definições"
              title="Em breve"
            >
              <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>
                settings
              </span>
            </button>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xl ring-2 ring-primary-container sm:h-10 sm:w-10"
              title={user?.displayName}
            >
              <span aria-hidden>{user?.avatarEmoji ?? '👤'}</span>
              <span className="sr-only">{user?.displayName}</span>
            </div>
            <ThemeToggle className="hidden sm:inline-flex" />
          </div>
        </div>
        <div className="flex justify-end border-t border-outline-variant/10 px-4 py-2 md:hidden">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto mt-[4.5rem] w-full max-w-[1200px] flex-1 px-4 pb-16 pt-8 sm:mt-28 sm:px-8 md:mb-20 md:pt-6">
        <section className="mb-10 md:mb-12">
          <h1 className="font-headline mb-2 text-3xl font-black tracking-tight text-on-surface md:text-4xl lg:text-5xl">
            Minha compra coletiva
          </h1>
          <p className="max-w-xl text-on-surface-variant">
            Gerencie suas listas de compras colaborativas e despesas compartilhadas.
          </p>
        </section>

        {loadError ? (
          <p className="mb-6 rounded-lg bg-[color-mix(in_srgb,var(--color-error-container)_12%,transparent)] px-4 py-3 text-sm font-medium text-error" role="alert">
            {loadError}
          </p>
        ) : null}

        <section className="mb-12 grid grid-cols-1 gap-6 md:mb-16 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setCreateName('');
              setCreateDescription('');
              setCreateOpen(true);
            }}
            className="surface-bento-primary group relative cursor-pointer overflow-hidden rounded-[1rem] p-8 text-left transition-transform duration-300 hover:scale-[1.02] md:rounded-[1.25rem]"
          >
            <div className="relative z-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                <span className="material-symbols-outlined text-white" aria-hidden>
                  add
                </span>
              </div>
              <h2 className="font-headline mb-2 text-2xl font-bold text-white">Criar nova lista</h2>
              <p className="max-w-xs text-sm text-on-primary/80">
                Comece uma nova aventura de compras e convide seus amigos ou família.
              </p>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -right-8 rotate-12 opacity-10 transition-transform duration-500 group-hover:rotate-0">
              <span className="material-symbols-outlined text-[160px] text-white" aria-hidden>
                shopping_basket
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setJoinCode('');
              setJoinOpen(true);
            }}
            className="group relative cursor-pointer overflow-hidden rounded-[1rem] bg-surface-container p-8 text-left transition-transform duration-300 hover:scale-[1.02] md:rounded-[1.25rem]"
          >
            <div className="relative z-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-primary" aria-hidden>
                  group_add
                </span>
              </div>
              <h2 className="font-headline mb-2 text-2xl font-bold text-on-surface">Entrar em uma lista</h2>
              <p className="max-w-xs text-sm text-on-surface-variant">
                Tem um código de compartilhamento? Digite-o para sincronizar com uma lista existente.
              </p>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -right-8 -rotate-12 opacity-[0.05] transition-transform duration-500 group-hover:rotate-0">
              <span className="material-symbols-outlined text-[160px] text-on-surface" aria-hidden>
                qr_code_2
              </span>
            </div>
          </button>
        </section>

        <section className="mb-12">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">
                Sincronização ao vivo
              </span>
              <h2 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">
                Listas compartilhadas ativas
              </h2>
            </div>
            <button
              type="button"
              className="group flex items-center gap-1 self-start text-sm font-bold text-primary transition-all hover:underline sm:self-auto"
              onClick={() =>
                archivedCount > 0
                  ? alert(`${archivedCount} lista(s) arquivada(s). Gestão de arquivo em breve.`)
                  : alert('Nenhuma lista arquivada.')
              }
            >
              Listas arquivadas
              {archivedCount > 0 ? (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] text-primary">
                  {archivedCount}
                </span>
              ) : null}
              <span
                className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1"
                aria-hidden
              >
                arrow_forward
              </span>
            </button>
          </div>

          {loading ? (
            <p className="text-on-surface-variant">A carregar listas…</p>
          ) : activeLists.length === 0 ? (
            <div className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-lowest p-10 text-center shadow-ambient">
              <p className="font-headline text-lg font-bold text-on-surface">Nenhuma lista ativa</p>
              <p className="mt-2 text-on-surface-variant">
                Crie uma lista ou entre com um código para começar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeLists.map((list) => {
                const detail = detailsById[list.id];
                const total = detail?.items.length ?? 0;
                const done = detail?.items.filter((i) => i.is_checked).length ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const members = detail?.members ?? [];
                const shown = members.slice(0, 3);
                const extra = Math.max(0, members.length - 3);

                return (
                  <Link
                    key={list.id}
                    to={`/lists/${list.id}`}
                    className="block rounded-[1rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-ambient transition-colors duration-300 hover:bg-surface-container-low md:rounded-[1.25rem]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <h3 className="font-headline text-lg font-bold text-on-surface">{list.name}</h3>
                      <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-1 font-headline text-[10px] font-bold tracking-wider text-primary">
                        #{list.share_code}
                      </span>
                    </div>
                    <div className="mb-6 flex -space-x-2">
                      {shown.map((m) => (
                        <div
                          key={m.user_id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-base"
                          title={m.display_name}
                        >
                          <span aria-hidden>{m.avatar_emoji}</span>
                        </div>
                      ))}
                      {extra > 0 ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-[10px] font-bold text-primary">
                          +{extra}
                        </div>
                      ) : null}
                      {members.length === 0 ? (
                        <span className="text-xs text-on-surface-variant">A carregar membros…</span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-on-surface-variant">Progresso</span>
                        <span className="font-bold text-primary">
                          {total > 0 ? `${done}/${total} itens` : '—'}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${total > 0 ? pct : 0}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12 flex flex-wrap justify-center gap-3">
          {insights.mostActive ? (
            <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-6 py-2 backdrop-blur-md">
              <span className="material-symbols-outlined text-sm text-primary" aria-hidden>
                trending_up
              </span>
              <span className="font-headline text-xs font-bold uppercase tracking-wider text-primary">
                Mais ativa: {insights.mostActive}
              </span>
            </div>
          ) : null}
          {insights.suggestion ? (
            <div className="flex items-center gap-2 rounded-full border border-tertiary/15 bg-tertiary/5 px-6 py-2 backdrop-blur-md">
              <span className="material-symbols-outlined text-sm text-tertiary" aria-hidden>
                auto_awesome
              </span>
              <span className="font-headline text-xs font-bold uppercase tracking-wider text-tertiary">
                {insights.suggestion}
              </span>
            </div>
          ) : null}
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-outline-variant/15 pt-8">
          <button
            type="button"
            onClick={handleLogout}
            className="font-body text-sm font-semibold text-on-surface-variant underline-offset-4 hover:text-primary hover:underline"
          >
            Sair
          </button>
          <Link to="/" className="text-sm font-semibold text-on-surface-variant hover:text-primary hover:underline">
            Site público
          </Link>
        </div>
      </main>

      <footer className="mt-auto w-full bg-surface-container py-10 md:py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-4 sm:px-8 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-headline text-lg font-bold text-on-surface">ShopShare</span>
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant md:text-left sm:text-xs">
              © {new Date().getFullYear()} ShopShare v2.1.0. Todos os direitos reservados.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8" aria-label="Rodapé">
            <a href="#" className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary sm:text-xs">
              Termos de serviço
            </a>
            <a href="#" className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary sm:text-xs">
              Privacidade
            </a>
            <a href="#" className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary sm:text-xs">
              Suporte
            </a>
            <a
              href="/health"
              className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary sm:text-xs"
              onClick={(e) => {
                e.preventDefault();
                window.open(
                  `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'}/health/`,
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            >
              Status da API
            </a>
          </nav>
        </div>
      </footer>

      {/* Modal: nova lista — layout Stitch (node c1238f00…) */}
      {createOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !createBusy && setCreateOpen(false)}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="create-list-title"
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl shadow-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 md:p-10">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low md:right-6 md:top-6"
                onClick={() => !createBusy && setCreateOpen(false)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden>
                  close
                </span>
              </button>

              <div className="mb-8 text-center">
                <h2 id="create-list-title" className="font-headline text-3xl font-extrabold text-primary">
                  Criar nova lista
                </h2>
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-primary" aria-hidden />
              </div>

              <form className="space-y-6" onSubmit={(e) => void handleCreateList(e)}>
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface-variant" htmlFor="new-list-name">
                    Nome da lista
                  </label>
                  <input
                    id="new-list-name"
                    className="w-full rounded-xl border-2 border-transparent bg-surface-container-low px-5 py-3.5 font-body font-medium text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-0"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Ex: Compras de casa"
                    autoFocus
                    autoComplete="off"
                  />
                  <p className="ml-1 text-xs text-on-surface-variant/70">
                    Dê um nome fácil de identificar para a sua nova lista.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    className="ml-1 block text-sm font-bold text-on-surface-variant"
                    htmlFor="new-list-description"
                  >
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="new-list-description"
                    rows={3}
                    className="w-full resize-none rounded-xl border-2 border-transparent bg-surface-container-low px-5 py-3.5 font-body font-medium text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-0"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Ex: Compras para o evento de sábado"
                  />
                  <p className="ml-1 text-xs text-on-surface-variant/70">
                    Opcional — visível no convite por link e no detalhe da lista.
                  </p>
                </div>

                {actionError && createOpen ? (
                  <p className="text-sm font-medium text-error" role="alert">
                    {actionError}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary py-4 font-headline text-lg font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                    disabled={createBusy}
                  >
                    {createBusy ? 'A criar…' : 'Criar lista'}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-xl py-2 font-semibold text-[#65518a] transition-colors hover:bg-surface-container-low dark:text-[#c4b5dc]"
                    onClick={() => setCreateOpen(false)}
                    disabled={createBusy}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: entrar com código — layout Stitch (node 99426f94…) */}
      {joinOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[color-mix(in_srgb,var(--color-on-surface)_45%,transparent)] p-4 backdrop-blur-sm dark:bg-black/50"
          role="presentation"
          onClick={() => !joinBusy && setJoinOpen(false)}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="join-list-title"
            aria-describedby="join-list-desc"
            className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl shadow-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary">
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden
                  >
                    group_add
                  </span>
                </div>
                <h2 id="join-list-title" className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                  Entrar em uma lista
                </h2>
                <p id="join-list-desc" className="mt-2 text-sm text-on-surface-variant">
                  Insira o código de 6 caracteres para aceder a uma lista partilhada.
                </p>
              </div>

              <form onSubmit={(e) => void handleJoinList(e)}>
                <div
                  className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-3"
                  onPaste={handleJoinPaste}
                >
                  {Array.from({ length: 6 }, (_, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        joinInputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="text"
                      autoCapitalize="characters"
                      autoComplete="off"
                      maxLength={1}
                      aria-label={`Carácter ${i + 1} do código`}
                      className="h-14 w-11 rounded-lg border-2 border-transparent bg-surface-container text-center font-headline text-2xl font-bold uppercase text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-container sm:w-12"
                      value={joinCode[i] ?? ''}
                      placeholder="-"
                      onChange={(e) => handleJoinSlotChange(i, e.target.value)}
                      onKeyDown={(e) => handleJoinSlotKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      disabled={joinBusy}
                    />
                  ))}
                </div>

                {actionError && joinOpen ? (
                  <p className="mb-4 text-center text-sm font-medium text-error" role="alert">
                    {actionError}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-headline font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    disabled={joinBusy}
                  >
                    <span>{joinBusy ? 'A entrar…' : 'Entrar'}</span>
                    {!joinBusy ? (
                      <span className="material-symbols-outlined text-[22px]" aria-hidden>
                        arrow_forward
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-transparent py-3 font-bold text-on-surface-variant transition-all hover:bg-surface-container-low active:scale-[0.98]"
                    onClick={() => !joinBusy && setJoinOpen(false)}
                    disabled={joinBusy}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t border-outline-variant/15 bg-surface-container-low px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-base" aria-hidden>
                  info
                </span>
                O código foi fornecido pelo criador da lista.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

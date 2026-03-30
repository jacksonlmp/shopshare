import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';
import type { ShoppingListDetailDto, ShoppingListSummaryDto } from '../types/lists';

function sidebarNavClass(active: boolean): string {
  return `group w-full rounded-full px-4 py-3 text-left font-headline text-sm font-bold tracking-tight transition-colors sm:text-base ${
    active
      ? 'bg-surface-container-highest text-primary'
      : 'text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary'
  }`;
}

function cardIcon(index: number): { icon: string; colorClass: string; bgClass: string } {
  const options = [
    { icon: 'outdoor_grill', colorClass: 'text-orange-600', bgClass: 'bg-orange-100' },
    { icon: 'shopping_basket', colorClass: 'text-green-600', bgClass: 'bg-green-100' },
    { icon: 'home_repair_service', colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
    { icon: 'restaurant', colorClass: 'text-rose-600', bgClass: 'bg-rose-100' },
  ] as const;
  return options[index % options.length]!;
}

function formatRelativeLabel(updatedAt: number | undefined): string {
  if (!updatedAt) return 'Atualizada recentemente';
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = Math.max(0, nowSec - updatedAt);
  if (diffSec < 3600) return 'Atualizada agora';
  if (diffSec < 86400) return `Atualizada há ${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `Atualizada há ${Math.floor(diffSec / 86400)} dia(s)`;
  return 'Atualizada há mais tempo';
}

export function CollectionsPage() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<ShoppingListSummaryDto[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, ShoppingListDetailDto>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get<ShoppingListSummaryDto[]>('/api/lists/');
      setSummaries(data);
      const active = data.filter((l) => !l.is_archived);
      const detailResults = await Promise.allSettled(
        active.map((l) => api.get<ShoppingListDetailDto>(`/api/lists/${l.id}/`).then((r) => r.data)),
      );
      const nextMap: Record<string, ShoppingListDetailDto> = {};
      for (const result of detailResults) {
        if (result.status === 'fulfilled') {
          nextMap[result.value.id] = result.value;
        }
      }
      setDetailsById(nextMap);
    } catch (err) {
      setSummaries([]);
      setDetailsById({});
      if (axios.isAxiosError(err) && typeof err.response?.data?.detail === 'string') {
        setError(err.response.data.detail);
      } else {
        setError('Não foi possível carregar as coleções.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const activeLists = useMemo(() => summaries.filter((l) => !l.is_archived), [summaries]);
  const archivedCount = useMemo(() => summaries.filter((l) => l.is_archived).length, [summaries]);

  const filteredLists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeLists;
    return activeLists.filter((list) => {
      const desc = list.description?.toLowerCase() ?? '';
      return list.name.toLowerCase().includes(q) || desc.includes(q) || list.share_code.toLowerCase().includes(q);
    });
  }, [activeLists, query]);

  return (
    <div className="flex min-h-screen bg-background font-body text-on-background antialiased">
      <aside
        className="glass-nav sticky top-0 z-50 h-dvh w-[280px] shrink-0 border-r border-outline-variant/10"
        aria-label="Navegação"
      >
        <div className="flex h-full flex-col px-5 py-6">
          <Link to="/" className="font-headline text-2xl font-black tracking-tight text-primary">
            ShopShare
          </Link>

          <nav className="mt-10 flex flex-col gap-1.5" aria-label="Principal">
            <NavLink to="/home" end className={({ isActive }) => sidebarNavClass(isActive)}>
              Painel
            </NavLink>
            <NavLink to="/collections" className={({ isActive }) => sidebarNavClass(isActive)}>
              Coleções
            </NavLink>
            <span className="cursor-not-allowed rounded-full px-4 py-3 font-headline text-sm font-bold tracking-tight text-on-surface-variant/50 sm:text-base" title="Em breve">
              Mercado
            </span>
            <span className="cursor-not-allowed rounded-full px-4 py-3 font-headline text-sm font-bold tracking-tight text-on-surface-variant/50 sm:text-base" title="Em breve">
              Perfil
            </span>
          </nav>

          <div className="mt-auto flex items-center gap-2 pt-6">
            <button
              type="button"
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-lowest"
              aria-label="Notificações"
              title="Em breve"
            >
              <span className="material-symbols-outlined" aria-hidden>
                notifications
              </span>
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-lowest"
              aria-label="Definições"
              title="Em breve"
            >
              <span className="material-symbols-outlined" aria-hidden>
                settings
              </span>
            </button>
            <ThemeToggle className="!h-10 !w-10" />
          </div>
        </div>
      </aside>

      <div className="fixed left-[280px] right-0 top-0 z-40 border-b border-outline-variant/10 bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
                <span>ShopShare</span>
                <span className="material-symbols-outlined text-xs" aria-hidden>
                  chevron_right
                </span>
                <span className="font-medium text-primary">Coleções</span>
              </nav>
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-background">
                Minhas Coleções
              </h1>
              <p className="mt-2 text-on-surface-variant">
                Gerencie suas listas de compras e compartilhe com quem importa.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="group relative">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
                  aria-hidden
                >
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar coleções..."
                  className="w-full rounded-full border border-outline-variant/30 bg-surface-container-lowest py-3 pl-12 pr-4 shadow-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary md:w-64"
                />
              </div>
              <button
                type="button"
                className="rounded-full border border-outline-variant/30 bg-surface-container-lowest p-3 text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container"
                title="Filtros em breve"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  filter_list
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-[140px] pb-16 sm:px-8 sm:pt-[160px]">
        
        {error ? (
          <p className="mb-6 rounded-lg bg-[color-mix(in_srgb,var(--color-error-container)_12%,transparent)] px-4 py-3 text-sm font-medium text-error" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-on-surface-variant">A carregar coleções...</p>
        ) : (
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-start">
            <aside className="w-full space-y-6 md:w-[38%]">
              <div className="space-y-4">
                {filteredLists.slice(0, 3).map((list, index) => {
                  const detail = detailsById[list.id];
                  const total = detail?.items.length ?? 0;
                  const done = detail?.items.filter((item) => item.is_checked).length ?? 0;
                  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
                  const icon = cardIcon(index);
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => navigate(`/lists/${list.id}`)}
                      className="group w-full cursor-pointer rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 text-left shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${icon.bgClass} ${icon.colorClass}`}>
                          <span className="material-symbols-outlined text-3xl" aria-hidden>{icon.icon}</span>
                        </div>
                        <span className="rounded-full bg-surface-container-low px-3 py-1 font-mono text-xs font-bold tracking-wider text-primary">
                          {list.share_code}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-on-surface transition-colors group-hover:text-primary">
                        {list.name}
                      </h3>
                      <p className="mb-5 text-sm text-on-surface-variant">{formatRelativeLabel(list.updated_at)}</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant">Progresso</span>
                          <span className="text-primary">
                            {done}/{total} itens
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex -space-x-2">
                            {(detail?.members ?? []).slice(0, 3).map((member, i) => (
                              <div
                                key={member.user_id}
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-surface-container-highest text-[10px] font-bold text-primary"
                                style={{ zIndex: 10 - i }}
                                title={member.display_name}
                              >
                                {member.avatar_emoji || member.display_name.slice(0, 1).toUpperCase()}
                              </div>
                            ))}
                            {(detail?.members.length ?? 0) > 3 ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-surface-container-highest text-[10px] font-bold text-primary">
                                +{(detail?.members.length ?? 0) - 3}
                              </div>
                            ) : null}
                          </div>
                          <span
                            className="material-symbols-outlined rounded-full p-2 text-primary transition-colors group-hover:bg-primary/10"
                            aria-hidden
                          >
                            more_vert
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredLists.length === 0 ? (
                  <p className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 text-on-surface-variant">
                    Sem coleções por enquanto.
                  </p>
                ) : null}
              </div>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold text-on-background">
                  <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>
                    archive
                  </span>
                  Arquivadas
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-8 shadow-sm transition-all hover:border-primary/20 hover:bg-surface-container-low"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors">
                      <span className="material-symbols-outlined" aria-hidden>
                        inventory_2
                      </span>
                    </div>
                    <span className="font-bold text-on-surface transition-colors hover:text-primary">
                      Ver Listas Arquivadas
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Você possui {archivedCount} coleções antigas
                    </span>
                  </div>
                </button>
              </section>
            </aside>

            <section className="flex-1">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="group flex min-h-[320px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/50 p-6 text-on-surface-variant transition-all hover:border-primary/50 hover:bg-surface-container-lowest"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low transition-colors group-hover:bg-primary-container">
                  <span
                    className="material-symbols-outlined text-3xl transition-colors group-hover:text-primary"
                    aria-hidden
                  >
                    add
                  </span>
                </div>
                <p className="mb-1 text-lg font-bold">Nova Coleção</p>
                <p className="text-center text-sm">Comece uma nova lista compartilhada agora.</p>
              </button>
            </section>
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => navigate('/home')}
        className="group fixed bottom-8 right-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:-translate-y-1 hover:shadow-primary/40 active:scale-95"
        aria-label="Criar nova lista"
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden>add</span>
        <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-lg bg-on-background px-4 py-2 text-sm font-bold text-on-primary opacity-0 transition-opacity group-hover:opacity-100">
          Criar Nova Lista
        </span>
      </button>
    </div>
  );
}


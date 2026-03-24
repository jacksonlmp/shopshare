import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';
import type { ShoppingListDetailDto } from '../types/lists';

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ShoppingListDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ShoppingListDetailDto>(`/api/lists/${listId}/`);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Lista não encontrada.');
        } else {
          setError('Não foi possível carregar a lista.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listId]);

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface antialiased">
      <header className="glass-nav fixed top-0 z-50 w-full">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:h-20 sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="font-headline text-sm font-bold text-primary hover:underline"
          >
            ← Voltar
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto mt-24 w-full max-w-[1200px] flex-1 px-4 pb-16 sm:mt-28 sm:px-8">
        {loading ? (
          <p className="text-on-surface-variant">A carregar…</p>
        ) : error ? (
          <div className="space-y-4">
            <p className="text-error" role="alert">
              {error}
            </p>
            <Link to="/home" className="font-semibold text-primary hover:underline">
              Ir para o painel
            </Link>
          </div>
        ) : detail ? (
          <>
            <div className="mb-8">
              <span className="mb-2 inline-block rounded-full bg-surface-container-high px-2 py-1 font-headline text-[10px] font-bold tracking-wider text-primary">
                #{detail.share_code}
              </span>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                {detail.name}
              </h1>
              <p className="mt-2 text-on-surface-variant">
                {detail.items.length} itens · {detail.members.length} pessoas
              </p>
              {detail.description?.trim() ? (
                <p className="mt-4 max-w-2xl whitespace-pre-wrap leading-relaxed text-on-surface-variant">
                  {detail.description.trim()}
                </p>
              ) : null}
            </div>
            <ul className="space-y-2 rounded-[1rem] border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-ambient sm:p-6">
              {detail.items.length === 0 ? (
                <li className="text-on-surface-variant">Sem itens ainda.</li>
              ) : (
                detail.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-surface-container-low"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        item.is_checked
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline-variant'
                      }`}
                      aria-hidden
                    >
                      {item.is_checked ? '✓' : ''}
                    </span>
                    <span
                      className={
                        item.is_checked ? 'text-on-surface-variant line-through' : 'font-medium text-on-surface'
                      }
                    >
                      {item.name}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        ) : null}
      </main>
    </div>
  );
}

import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';
import { useSessionStore } from '../store/useSessionStore';
import type { ShoppingListInvitePreviewDto, ShoppingListSummaryDto } from '../types/lists';
import { isValidBannerHex } from '../utils/banner';

const BANNER_IMG = '/images/hero-frutas.png';

function normalizeShareCode(raw: string | undefined): string {
  if (!raw) return '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function InvitePage() {
  const { shareCode: shareCodeParam } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);

  const code = useMemo(() => normalizeShareCode(shareCodeParam), [shareCodeParam]);
  const invalidCode = code.length !== 6;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<ShoppingListInvitePreviewDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidCode) return;
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    (async () => {
      try {
        const { data } = await api.get<ShoppingListInvitePreviewDto>(`/api/lists/invite/${code}/`);
        if (!cancelled) {
          setPreview(data);
        }
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setPreviewError('Este convite não é válido ou a lista já não está disponível.');
        } else {
          setPreviewError('Não foi possível carregar os detalhes do convite.');
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, invalidCode]);

  const goLogin = useCallback(() => {
    navigate(`/login?redirect=${encodeURIComponent(`/invite/${code}`)}`, { replace: false });
  }, [navigate, code]);

  const acceptInvite = useCallback(async () => {
    setError(null);
    if (!user) {
      goLogin();
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<{ id: string }>('/api/lists/join/', { share_code: code });
      navigate(`/lists/${data.id}`, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        try {
          const { data: lists } = await api.get<ShoppingListSummaryDto[]>('/api/lists/');
          const found = lists.find((l) => l.share_code === code);
          if (found) {
            navigate(`/lists/${found.id}`, { replace: true });
            return;
          }
        } catch {
          /* fall through */
        }
        setError('Já faz parte desta lista.');
        return;
      }
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { error?: string; detail?: string } | undefined;
        const msg =
          typeof d?.error === 'string'
            ? d.error
            : typeof d?.detail === 'string'
              ? d.detail
              : 'Código inválido ou lista indisponível.';
        setError(msg);
        return;
      }
      setError('Não foi possível entrar na lista.');
    } finally {
      setBusy(false);
    }
  }, [user, code, navigate, goLogin]);

  if (invalidCode) {
    return <Navigate to="/" replace />;
  }

  const ownerLabel = preview?.owner_display_name?.trim() || 'Organizador';
  const listTitle =
    previewLoading && !preview
      ? 'Lista partilhada'
      : preview
        ? preview.name
        : 'Lista partilhada';

  const inviteBannerHex = preview?.banner_color_hex?.trim() ?? '';
  const inviteImg = preview?.banner_image_url?.trim() ?? '';
  const inviteHasImg = Boolean(inviteImg);
  const inviteHasHex = Boolean(preview && isValidBannerHex(inviteBannerHex));
  const inviteHexUpper = inviteHasHex ? inviteBannerHex.toUpperCase() : '';
  const inviteHeroLoading = previewLoading && !preview;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface font-body text-on-surface antialiased">
      {/* Fundo estilo painel desfocado (referência Stitch) */}
      <div
        className="pointer-events-none absolute inset-0 select-none opacity-50 blur-md"
        aria-hidden
      >
        <div className="mx-auto max-w-7xl px-6 pt-28 md:px-12">
          <div className="mb-8 h-8 w-48 rounded-lg bg-surface-container-high" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 h-40 rounded-xl bg-surface-container-low" />
            <div className="h-40 rounded-xl bg-primary-container/40" />
          </div>
        </div>
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          to="/"
          className="font-headline text-xl font-extrabold tracking-tight text-primary sm:text-2xl"
        >
          ShopShare
        </Link>
        <ThemeToggle />
      </header>

      {/* Overlay + modal convite via link — Stitch node 2271bb6a… */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color-mix(in_srgb,var(--color-on-surface)_40%,transparent)] p-4 backdrop-blur-sm dark:bg-black/45">
        <div
          role="dialog"
          aria-modal
          aria-labelledby="invite-title"
          aria-describedby="invite-details"
          className="max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl shadow-primary/15"
        >
          <div className="relative h-48 w-full shrink-0">
            {inviteHeroLoading ? (
              <img
                src={BANNER_IMG}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : inviteHasImg ? (
              <img
                src={inviteImg}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : inviteHasHex ? (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(145deg, ${inviteHexUpper}, color-mix(in srgb, ${inviteHexUpper} 48%, black))`,
                }}
                aria-hidden
              />
            ) : (
              <img
                src={BANNER_IMG}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {inviteHasHex && inviteHasImg ? (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${inviteHexUpper} 52%, transparent), color-mix(in srgb, ${inviteHexUpper} 22%, black))`,
                }}
                aria-hidden
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 flex w-full items-end gap-3 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-surface-container-lowest/90 text-2xl shadow-lg">
                <span aria-hidden>🛒</span>
              </div>
              <div className="min-w-0 text-white">
                <p className="text-xs font-medium uppercase tracking-tight opacity-90">Proprietário</p>
                <p className="truncate font-headline font-bold">{ownerLabel}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 id="invite-title" className="font-headline text-2xl font-extrabold leading-tight text-on-surface">
              Foi convidado para a lista: {listTitle}
            </h2>
            <div id="invite-details">
              <p className="mt-2 text-sm font-semibold text-primary">Código #{code}</p>
              {previewLoading ? (
                <p className="mb-8 mt-4 text-sm text-on-surface-variant">A carregar detalhes…</p>
              ) : previewError ? (
                <p className="mb-8 mt-4 text-sm text-error" role="alert">
                  {previewError}
                </p>
              ) : preview?.description?.trim() ? (
                <p className="mb-8 mt-4 whitespace-pre-wrap leading-relaxed text-on-surface-variant">
                  {preview.description.trim()}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="mb-4 text-sm font-medium text-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void acceptInvite()}
                disabled={busy || !!previewError}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-headline text-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-dim active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden>
                  group_add
                </span>
                {user ? (busy ? 'A entrar…' : 'Entrar na lista') : 'Iniciar sessão e entrar'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => navigate(user ? '/home' : '/', { replace: true })}
                className="w-full rounded-full py-3 font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
              >
                Ignorar
              </button>
            </div>
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-base" aria-hidden>
                lock
              </span>
              Lista compartilhada apenas com convidados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

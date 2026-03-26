import axios from 'axios';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';
import { getStoredUser } from '../services/storage';
import type { CategoryDto, ItemSuggestionDto } from '../types/items';
import type { ListItemDto, ListMemberDto, ShoppingListDetailDto } from '../types/lists';
import { colorPickerFallback, isValidBannerHex } from '../utils/banner';

const FALLBACK_SUGGESTION_CHIPS = ['Arroz', 'Feijão', 'Óleo', 'Açúcar'] as const;

const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'un', label: 'un' },
  { value: 'kg', label: 'kg' },
  { value: 'L', label: 'L' },
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: 'pct', label: 'pct' },
  { value: 'cx', label: 'cx' },
  { value: 'dz', label: 'dz' },
];

/** Layout Stitch: 6 categorias fixas (ícone Material + nome PT). IDs vêm do GET /api/categories/. */
const MODAL_CATEGORY_DEFS = [
  { name: 'Frutas', icon: 'nutrition' },
  { name: 'Laticínios', icon: 'icecream' },
  { name: 'Carnes', icon: 'restaurant' },
  { name: 'Limpeza', icon: 'sanitizer' },
  { name: 'Bebidas', icon: 'local_bar' },
  { name: 'Padaria', icon: 'bakery_dining' },
] as const;

function formatAddItemApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'Não foi possível adicionar o item.';
  const d = err.response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && 'detail' in d) {
    const det = (d as { detail: unknown }).detail;
    if (typeof det === 'string') return det;
    if (Array.isArray(det)) return det.map(String).join(' ');
  }
  if (d && typeof d === 'object') {
    const parts = Object.entries(d as Record<string, unknown>).flatMap(([k, v]) => {
      if (Array.isArray(v)) return [`${k}: ${v.join(', ')}`];
      if (typeof v === 'string') return [`${k}: ${v}`];
      return [];
    });
    if (parts.length) return parts.join(' ');
  }
  return 'Não foi possível adicionar o item.';
}

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return parts[0]?.toUpperCase() || '?';
}

function formatItemQuantity(item: ListItemDto): string | null {
  const q = item.quantity;
  const u = item.unit?.trim();
  if (u) {
    const qStr = q != null ? String(q).replace(/\.0$/, '') : '';
    return qStr ? `${qStr} ${u}` : u;
  }
  if (q != null && q !== 1) {
    return `${String(q).replace(/\.0$/, '')} unidades`;
  }
  if (q === 1) return '1 unidade';
  return null;
}

function formatItemDescription(item: ListItemDto): string | null {
  const note = item.note?.trim();
  return note || null;
}

function groupItemsByCategory(items: ListItemDto[]) {
  const order: string[] = [];
  const map = new Map<
    string,
    { label: string; emoji: string; items: ListItemDto[] }
  >();
  for (const item of items) {
    const key = item.category ? `c-${item.category.id}` : 'none';
    if (!map.has(key)) {
      map.set(key, {
        label: item.category?.name ?? 'Outros',
        emoji: item.category?.emoji ?? '📦',
        items: [],
      });
      order.push(key);
    }
    map.get(key)!.items.push(item);
  }
  return order.map((k) => {
    const g = map.get(k)!;
    return { key: k, label: g.label, emoji: g.emoji, items: g.items };
  });
}

const AVATAR_RING = [
  'bg-primary-container text-on-primary-container',
  'bg-surface-container-highest text-on-surface',
  'bg-[color-mix(in_srgb,var(--color-tertiary)_22%,var(--color-surface-container-low))] text-tertiary',
] as const;

function memberStyle(i: number) {
  return AVATAR_RING[i % AVATAR_RING.length]!;
}

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ShoppingListDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addQuantity, setAddQuantity] = useState('1');
  const [addUnit, setAddUnit] = useState('un');
  const [addNote, setAddNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesLoadFailed, setCategoriesLoadFailed] = useState(false);
  const [suggestions, setSuggestions] = useState<ItemSuggestionDto[]>([]);
  const [modalDataLoading, setModalDataLoading] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [editBannerColor, setEditBannerColor] = useState('');
  const [editBannerImageUrl, setEditBannerImageUrl] = useState('');
  const [bannerSaveBusy, setBannerSaveBusy] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const bannerColorPickerRef = useRef<HTMLInputElement>(null);
  /** True after the native colour dialog actually changes the picker value (some OS/browsers skip React onChange). */
  const bannerPickerUserChangedRef = useRef(false);

  const syncBannerColorFromPicker = useCallback((el: HTMLInputElement) => {
    bannerPickerUserChangedRef.current = true;
    setEditBannerColor(el.value.toUpperCase());
  }, []);

  const loadDetail = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ShoppingListDetailDto>(`/api/lists/${listId}/`);
      setDetail(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Lista não encontrada.');
      } else {
        setError('Não foi possível carregar a lista.');
      }
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!addOpen || !listId) return;
    let cancelled = false;
    (async () => {
      setModalDataLoading(true);
      setCategoriesLoadFailed(false);
      const settled = await Promise.allSettled([
        api.get<CategoryDto[]>('/api/categories/'),
        api.get<ItemSuggestionDto[]>(`/api/lists/${listId}/suggestions/`),
      ]);
      if (cancelled) return;
      const [catResult, sugResult] = settled;
      if (catResult.status === 'fulfilled') {
        setCategories(catResult.value.data);
        setCategoriesLoadFailed(false);
      } else {
        setCategories([]);
        setCategoriesLoadFailed(true);
      }
      if (sugResult.status === 'fulfilled') {
        setSuggestions(sugResult.value.data);
      } else {
        setSuggestions([]);
      }
      setModalDataLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [addOpen, listId]);

  useEffect(() => {
    if (!bannerEditOpen) return;
    const el = bannerColorPickerRef.current;
    if (!el) return;
    const handler = () => syncBannerColorFromPicker(el);
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
    return () => {
      el.removeEventListener('input', handler);
      el.removeEventListener('change', handler);
    };
  }, [bannerEditOpen, syncBannerColorFromPicker]);

  const categoryByName = useMemo(() => {
    const m = new Map<string, CategoryDto>();
    for (const c of categories) {
      m.set(c.name, c);
    }
    return m;
  }, [categories]);

  const isListOwner = useMemo(() => {
    if (!detail) return false;
    const u = getStoredUser();
    return Boolean(u?.userId === detail.owner_id);
  }, [detail]);

  const bannerVisual = useMemo(() => {
    if (!detail) {
      return { hasImg: false, hasHex: false, img: '', hex: '' };
    }
    const img = detail.banner_image_url?.trim() ?? '';
    const hexRaw = detail.banner_color_hex?.trim() ?? '';
    const hasImg = Boolean(img);
    const hasHex = isValidBannerHex(hexRaw);
    return {
      hasImg,
      hasHex,
      img,
      hex: hasHex ? hexRaw.toUpperCase() : '',
    };
  }, [detail]);

  const suggestionChipNames = useMemo(() => {
    const fromApi = suggestions
      .map((s) => s.item_name.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of [...fromApi, ...FALLBACK_SUGGESTION_CHIPS]) {
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
      if (out.length >= 8) break;
    }
    return out;
  }, [suggestions]);

  const memberById = useMemo(() => {
    const m = new Map<string, ListMemberDto>();
    if (!detail) return m;
    for (const row of detail.members) {
      m.set(row.user_id, row);
    }
    return m;
  }, [detail]);

  const grouped = useMemo(
    () => (detail ? groupItemsByCategory(detail.items) : []),
    [detail],
  );

  const progress = useMemo(() => {
    if (!detail?.items.length) return { done: 0, total: 0, pct: 0 };
    const total = detail.items.length;
    const done = detail.items.filter((i) => i.is_checked).length;
    return { done, total, pct: Math.round((done / total) * 1000) / 10 };
  }, [detail]);

  const inviteUrl = useMemo(() => {
    if (!detail) return '';
    return `${window.location.origin}/invite/${detail.share_code}`;
  }, [detail]);

  async function handleCopyCode() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.share_code);
      setCopyHint('Código copiado');
      setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint('Não foi possível copiar');
      setTimeout(() => setCopyHint(null), 2000);
    }
  }

  async function handleShare() {
    if (!detail) return;
    const title = detail.name;
    const text = `Entra na lista «${detail.name}» no ShopShare`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: inviteUrl });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setCopyHint('Link copiado');
        setTimeout(() => setCopyHint(null), 2000);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopyHint('Link copiado');
        setTimeout(() => setCopyHint(null), 2000);
      } catch {
        setCopyHint('Não foi possível partilhar');
        setTimeout(() => setCopyHint(null), 2000);
      }
    }
  }

  async function handleToggleItem(item: ListItemDto, next: boolean) {
    if (!listId) return;
    setCheckingId(item.id);
    const prev = detail;
    setDetail((d) => {
      if (!d) return d;
      return {
        ...d,
        items: d.items.map((it) =>
          it.id === item.id ? { ...it, is_checked: next } : it,
        ),
      };
    });
    try {
      await api.patch(`/api/items/${item.id}/check/`, { is_checked: next });
    } catch {
      setDetail(prev);
      setItemError('Não foi possível atualizar o item.');
    } finally {
      setCheckingId(null);
    }
  }

  function openAddModal() {
    setItemError(null);
    setAddName('');
    setAddQuantity('1');
    setAddUnit('un');
    setAddNote('');
    setSelectedCategoryId(null);
    setAddOpen(true);
  }

  function openBannerEditor() {
    if (!detail) return;
    bannerPickerUserChangedRef.current = false;
    setEditBannerColor(detail.banner_color_hex?.trim() ?? '');
    setEditBannerImageUrl(detail.banner_image_url?.trim() ?? '');
    setBannerError(null);
    setBannerEditOpen(true);
  }

  async function saveBanner(e: FormEvent) {
    e.preventDefault();
    if (!listId) return;
    let c = editBannerColor.trim();
    const u = editBannerImageUrl.trim();
    if (!c && bannerPickerUserChangedRef.current) {
      const fromPicker = (bannerColorPickerRef.current?.value ?? '').trim().toUpperCase();
      if (isValidBannerHex(fromPicker)) {
        c = fromPicker;
      }
    }
    if (c && !isValidBannerHex(c)) {
      setBannerError('Use uma cor no formato #RRGGBB (ex.: #652FE7).');
      return;
    }
    setBannerSaveBusy(true);
    setBannerError(null);
    try {
      await api.patch(`/api/lists/${listId}/`, {
        banner_color_hex: c || '',
        banner_image_url: u || '',
      });
      setBannerEditOpen(false);
      await loadDetail();
    } catch (err) {
      setBannerError(formatAddItemApiError(err));
    } finally {
      setBannerSaveBusy(false);
    }
  }

  async function clearBannerAndSave() {
    if (!listId) return;
    bannerPickerUserChangedRef.current = false;
    setBannerSaveBusy(true);
    setBannerError(null);
    try {
      await api.patch(`/api/lists/${listId}/`, {
        banner_color_hex: '',
        banner_image_url: '',
      });
      setEditBannerColor('');
      setEditBannerImageUrl('');
      setBannerEditOpen(false);
      await loadDetail();
    } catch (err) {
      setBannerError(formatAddItemApiError(err));
    } finally {
      setBannerSaveBusy(false);
    }
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!listId) return;
    const name = addName.trim();
    if (!name) {
      setItemError('Indique o nome do item.');
      return;
    }
    setItemError(null);
    setAddBusy(true);
    const qty = parseFloat(String(addQuantity).replace(',', '.'));
    const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const payload: {
      name: string;
      quantity: number;
      unit?: string;
      note?: string;
      category?: number;
    } = { name, quantity };
    const u = addUnit.trim();
    if (u) payload.unit = u;
    const note = addNote.trim();
    if (note) payload.note = note;
    if (selectedCategoryId != null) payload.category = selectedCategoryId;
    try {
      await api.post(`/api/lists/${listId}/items/`, payload);
      setAddOpen(false);
      setAddName('');
      setAddQuantity('1');
      setAddUnit('un');
      setAddNote('');
      setSelectedCategoryId(null);
      await loadDetail();
    } catch (err) {
      setItemError(formatAddItemApiError(err));
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-on-surface antialiased">
      <header className="glass-nav fixed top-0 z-50 w-full border-b border-outline-variant/15">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="shrink-0 font-headline text-sm font-bold text-primary hover:underline"
            >
              ← Voltar
            </button>
            <Link
              to="/home"
              className="hidden truncate font-headline text-lg font-extrabold tracking-tight text-primary sm:block"
            >
              ShopShare
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pb-12 sm:pt-28">
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
            {/* Hero — cor / imagem URL (dono) ou gradiente padrão */}
            <section className="mb-6 overflow-hidden rounded-lg border border-outline-variant/20 shadow-sm">
              <div className="relative h-48 w-full md:h-64">
                {bannerVisual.hasImg ? (
                  <img
                    src={bannerVisual.img}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                {bannerVisual.hasHex ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: bannerVisual.hasImg
                        ? `linear-gradient(135deg, color-mix(in srgb, ${bannerVisual.hex} 52%, transparent), color-mix(in srgb, ${bannerVisual.hex} 22%, black))`
                        : `linear-gradient(145deg, ${bannerVisual.hex}, color-mix(in srgb, ${bannerVisual.hex} 48%, black))`,
                    }}
                    aria-hidden
                  />
                ) : null}
                {!bannerVisual.hasHex && !bannerVisual.hasImg ? (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dim to-tertiary"
                    aria-hidden
                  />
                ) : null}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                  aria-hidden
                />
                {isListOwner ? (
                  <button
                    type="button"
                    onClick={openBannerEditor}
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                    aria-label="Personalizar banner"
                    title="Personalizar banner"
                  >
                    <span className="material-symbols-outlined text-[22px]" aria-hidden>
                      palette
                    </span>
                  </button>
                ) : null}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <span className="mb-2 inline-block w-fit rounded bg-primary px-2 py-1 font-headline text-[10px] font-bold uppercase tracking-wider text-on-primary shadow-sm">
                    Lista partilhada
                  </span>
                  <h2 className="font-headline text-2xl font-extrabold tracking-tight md:text-3xl">
                    {detail.name}
                  </h2>
                  {detail.description?.trim() ? (
                    <p className="mt-1 max-w-xl text-sm font-medium opacity-90">
                      {detail.description.trim()}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Cabeçalho: código, partilha, progresso, membros */}
            <section className="mb-6 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-ambient sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="min-w-0">
                  <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
                    {detail.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 shadow-sm">
                      <span className="font-mono text-sm font-bold uppercase tracking-widest text-primary">
                        {detail.share_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyCode()}
                        className="flex items-center border-l border-primary/20 pl-2 text-primary transition-colors hover:text-primary-dim"
                        aria-label="Copiar código"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden>
                          content_copy
                        </span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleShare()}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary"
                      aria-label="Partilhar convite"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden>
                        share
                      </span>
                    </button>
                  </div>
                  {copyHint ? (
                    <p className="mt-2 text-xs font-medium text-primary" role="status">
                      {copyHint}
                    </p>
                  ) : null}
                </div>
                <div className="text-left md:text-right">
                  <span className="text-sm font-semibold text-on-surface-variant">
                    {progress.total === 0
                      ? 'Sem itens'
                      : `${progress.done} de ${progress.total} itens`}
                  </span>
                  <div className="mt-2 h-2 w-full max-w-[12rem] overflow-hidden rounded-full border border-outline-variant/20 bg-surface-container md:ml-auto">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${progress.total ? progress.pct : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-surface-container pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Membros:
                </span>
                <div className="flex -space-x-2">
                  {detail.members.map((m, i) => (
                    <div
                      key={m.user_id}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest text-[10px] font-bold shadow-sm ${memberStyle(i)}`}
                      title={m.display_name}
                    >
                      {m.avatar_emoji?.trim() || initialsFromDisplayName(m.display_name)}
                    </div>
                  ))}
                  <Link
                    to={`/invite/${detail.share_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-on-surface-variant transition-colors hover:bg-primary hover:text-on-primary"
                    aria-label="Convidar mais pessoas"
                    title="Convidar"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>
                      person_add
                    </span>
                  </Link>
                </div>
              </div>
            </section>

            {itemError && !addOpen ? (
              <p className="mb-4 text-sm font-medium text-error" role="alert">
                {itemError}
              </p>
            ) : null}

            {/* Itens por categoria */}
            <div className="space-y-6">
              {grouped.length === 0 ? (
                <p className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6 text-center text-on-surface-variant shadow-sm">
                  Sem itens ainda. Use o botão + para adicionar.
                </p>
              ) : (
                grouped.map((section) => (
                  <section key={section.key}>
                    <div className="mb-3 flex items-center gap-2 px-2">
                      <span className="text-lg" aria-hidden>
                        {section.emoji}
                      </span>
                      <h2 className="font-headline text-lg font-bold text-on-surface">
                        {section.label}
                      </h2>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
                      {section.items.map((item, idx) => {
                        const adder = item.added_by
                          ? memberById.get(item.added_by)
                          : undefined;
                        const quantityInfo = formatItemQuantity(item);
                        const descriptionInfo = formatItemDescription(item);
                        const isLast = idx === section.items.length - 1;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-container-low ${
                              isLast ? '' : 'border-b border-surface-container-low'
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              <input
                                type="checkbox"
                                checked={item.is_checked}
                                disabled={checkingId === item.id}
                                onChange={(e) =>
                                  void handleToggleItem(item, e.target.checked)
                                }
                                className="h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-primary"
                                aria-label={`Marcar ${item.name}`}
                              />
                              <div className="min-w-0 flex flex-col">
                                <span
                                  className={`font-medium text-on-surface ${
                                    item.is_checked ? 'line-through opacity-50' : ''
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {quantityInfo ? (
                                  <span className="text-xs text-on-surface-variant">
                                    {quantityInfo}
                                  </span>
                                ) : null}
                                {descriptionInfo ? (
                                  <span className="text-xs text-on-surface-variant/90">
                                    {descriptionInfo}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {adder ? (
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold shadow-sm ${memberStyle(
                                  Math.max(
                                    0,
                                    detail.members.findIndex((x) => x.user_id === adder.user_id),
                                  ),
                                )}`}
                                title={adder.display_name}
                              >
                                {adder.avatar_emoji?.trim() ||
                                  initialsFromDisplayName(adder.display_name)}
                              </div>
                            ) : (
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-[9px] font-bold text-on-surface-variant"
                                aria-hidden
                              >
                                ·
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            {/* FAB */}
            <div className="fixed bottom-8 right-6 z-40">
              <button
                type="button"
                onClick={openAddModal}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary-dim active:scale-95"
                aria-label="Adicionar item"
              >
                <span className="material-symbols-outlined text-3xl" aria-hidden>
                  add
                </span>
              </button>
            </div>
          </>
        ) : null}
      </main>

      {addOpen && detail ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[color-mix(in_srgb,var(--color-on-background)_40%,transparent)] p-4 backdrop-blur-sm sm:items-center dark:bg-black/45"
          role="presentation"
          onClick={() => !addBusy && setAddOpen(false)}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="add-item-title"
            className="flex max-h-[min(92vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-6">
              <h2
                id="add-item-title"
                className="font-headline text-2xl font-extrabold tracking-tight text-on-background"
              >
                Adicionar Item
              </h2>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
                onClick={() => !addBusy && setAddOpen(false)}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined text-[24px]" aria-hidden>
                  close
                </span>
              </button>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => void handleAddItem(e)}
            >
              <div className="max-h-[min(70vh,51rem)] min-h-0 flex-1 overflow-y-auto p-8">
                <div className="mb-8">
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-outline">
                    Sugestões frequentes
                  </label>
                  {modalDataLoading ? (
                    <p className="text-sm text-on-surface-variant">A carregar sugestões…</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {suggestionChipNames.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="rounded-full border border-outline-variant px-5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:border-primary hover:bg-primary-container/10 hover:text-primary"
                          onClick={() => setAddName(label)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label
                      className="mb-2 block text-sm font-semibold text-on-surface-variant"
                      htmlFor="add-item-name"
                    >
                      Nome do item
                    </label>
                    <input
                      id="add-item-name"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="w-full rounded-xl border-0 bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Ex: Arroz Integral"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-on-surface-variant"
                      htmlFor="add-item-qty"
                    >
                      Quantidade
                    </label>
                    <input
                      id="add-item-qty"
                      type="number"
                      min={0.01}
                      step="any"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      className="w-full rounded-xl border-0 bg-surface-container-low px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-on-surface-variant"
                      htmlFor="add-item-unit"
                    >
                      Unidade
                    </label>
                    <div className="relative">
                      <select
                        id="add-item-unit"
                        value={addUnit}
                        onChange={(e) => setAddUnit(e.target.value)}
                        className="w-full appearance-none rounded-xl border-0 bg-surface-container-low py-3 pl-4 pr-10 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {UNIT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[22px]"
                        aria-hidden
                      >
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-outline">
                    Selecione a Categoria
                  </label>
                  {categoriesLoadFailed ? (
                    <p className="mb-3 text-sm text-error" role="status">
                      Não foi possível carregar os IDs das categorias. Pode adicionar o item sem
                      categoria ou tentar fechar e abrir o modal.
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {MODAL_CATEGORY_DEFS.map((def) => {
                      const apiCat = categoryByName.get(def.name);
                      const hasId = apiCat != null;
                      const selected =
                        hasId && selectedCategoryId === apiCat.id;
                      const fillSelected = selected ? 1 : 0;
                      return (
                        <button
                          key={def.name}
                          type="button"
                          disabled={!hasId}
                          onClick={() => {
                            if (!apiCat) return;
                            setSelectedCategoryId(selected ? null : apiCat.id);
                          }}
                          className={`group relative flex flex-col items-center rounded-lg p-4 text-center transition-all ${
                            selected
                              ? 'border-2 border-primary bg-primary-container/20'
                              : 'border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high'
                          } ${!hasId ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {selected ? (
                            <span
                              className="material-symbols-outlined absolute right-2 top-2 text-lg text-primary"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              aria-hidden
                            >
                              check_circle
                            </span>
                          ) : null}
                          <span
                            className={`mb-2 inline-flex h-10 w-10 shrink-0 items-center justify-center leading-none material-symbols-outlined text-[32px] ${
                              selected
                                ? 'text-primary'
                                : 'text-on-surface-variant group-hover:text-primary'
                            }`}
                            style={{ fontVariationSettings: `'FILL' ${fillSelected}` }}
                            aria-hidden
                          >
                            {def.icon}
                          </span>
                          <span
                            className={
                              selected
                                ? 'text-sm font-bold text-on-primary-container'
                                : 'text-sm font-medium text-on-surface-variant'
                            }
                          >
                            {def.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-2">
                  <label
                    className="mb-2 block text-sm font-semibold text-on-surface-variant"
                    htmlFor="add-item-note"
                  >
                    Nota (opcional)
                  </label>
                  <textarea
                    id="add-item-note"
                    rows={3}
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    className="w-full resize-none rounded-xl border-0 bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Comprar apenas se estiver maduro"
                  />
                </div>

                {itemError ? (
                  <p className="mt-4 text-sm font-medium text-error" role="alert">
                    {itemError}
                  </p>
                ) : null}
              </div>

              <div className="p-8 pt-0">
                <button
                  type="submit"
                  disabled={addBusy}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#7C4DFF] py-5 font-headline text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-[#6A3DE8] active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    add
                  </span>
                  {addBusy ? 'A adicionar…' : 'Adicionar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {bannerEditOpen && detail ? (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center bg-[color-mix(in_srgb,var(--color-on-background)_40%,transparent)] p-4 backdrop-blur-sm dark:bg-black/45"
          role="presentation"
          onClick={() => !bannerSaveBusy && setBannerEditOpen(false)}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="banner-edit-title"
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"
              onClick={() => !bannerSaveBusy && setBannerEditOpen(false)}
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden>
                close
              </span>
            </button>
            <div className="p-6 pt-14 sm:p-8 sm:pt-16">
              <h2
                id="banner-edit-title"
                className="font-headline text-xl font-extrabold text-on-surface"
              >
                Personalizar banner
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Cor de destaque e imagem (URL https). Deixe em branco para o estilo padrão.
              </p>
              <form className="mt-6 space-y-5" onSubmit={(e) => void saveBanner(e)}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface-variant" htmlFor="banner-color-hex">
                    Cor (#RRGGBB)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={bannerColorPickerRef}
                      id="banner-color-picker"
                      type="color"
                      value={colorPickerFallback(editBannerColor)}
                      onChange={(e) => syncBannerColorFromPicker(e.currentTarget)}
                      onInput={(e) => syncBannerColorFromPicker(e.currentTarget as HTMLInputElement)}
                      className="h-12 w-14 cursor-pointer rounded-lg border border-outline-variant/40 bg-surface-container-low"
                      aria-label="Escolher cor"
                    />
                    <input
                      id="banner-color-hex"
                      value={editBannerColor}
                      onChange={(e) => setEditBannerColor(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border-0 bg-surface-container-low px-4 py-3 font-mono text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="#652FE7"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-on-surface-variant"
                    htmlFor="banner-image-url"
                  >
                    URL da imagem
                  </label>
                  <input
                    id="banner-image-url"
                    type="url"
                    value={editBannerImageUrl}
                    onChange={(e) => setEditBannerImageUrl(e.target.value)}
                    className="w-full rounded-xl border-0 bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="https://…"
                    autoComplete="off"
                  />
                  {editBannerImageUrl.trim() ? (
                    <img
                      src={editBannerImageUrl.trim()}
                      alt=""
                      className="mt-3 h-28 w-full rounded-lg border border-outline-variant/20 object-cover"
                    />
                  ) : null}
                </div>
                {bannerError ? (
                  <p className="text-sm font-medium text-error" role="alert">
                    {bannerError}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={bannerSaveBusy}
                    className="rounded-xl bg-primary px-6 py-3 font-headline font-bold text-on-primary shadow-lg disabled:opacity-50"
                  >
                    {bannerSaveBusy ? 'A guardar…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    disabled={bannerSaveBusy}
                    onClick={() => void clearBannerAndSave()}
                    className="rounded-xl border border-outline-variant/40 px-6 py-3 font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Repor padrão
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

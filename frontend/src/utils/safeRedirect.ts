/** Evita open redirect: só caminhos relativos internos. */
export function isSafeRedirect(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  return true;
}

/** Destino após login: nunca volta para `/login` (evita loop). */
export function resolvePostLoginRedirect(raw: string | null): string {
  if (raw && isSafeRedirect(raw)) {
    const path = raw.split('?')[0];
    if (path && !path.toLowerCase().startsWith('/login')) {
      return raw;
    }
  }
  return '/home';
}

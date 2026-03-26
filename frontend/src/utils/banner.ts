/** Cor do banner no formato #RRGGBB (API Django). */
export function isValidBannerHex(value: string | undefined | null): boolean {
  if (!value?.trim()) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function colorPickerFallback(hex: string | undefined | null): string {
  return isValidBannerHex(hex) ? hex!.trim().toUpperCase() : '#652FE7';
}

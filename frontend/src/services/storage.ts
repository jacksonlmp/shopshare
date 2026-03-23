import type { UserProfile } from '../types/domain';

const USER_ID_KEY = 'user_id';
const DISPLAY_NAME_KEY = 'display_name';
const AVATAR_EMOJI_KEY = 'avatar_emoji';

export function getStoredUser(): UserProfile | null {
  const userId = localStorage.getItem(USER_ID_KEY);
  const displayName = localStorage.getItem(DISPLAY_NAME_KEY);
  const avatarEmoji = localStorage.getItem(AVATAR_EMOJI_KEY);

  if (!userId || !displayName || !avatarEmoji) {
    return null;
  }

  return { userId, displayName, avatarEmoji };
}

export function saveStoredUser(user: UserProfile): void {
  localStorage.setItem(USER_ID_KEY, user.userId);
  localStorage.setItem(DISPLAY_NAME_KEY, user.displayName);
  localStorage.setItem(AVATAR_EMOJI_KEY, user.avatarEmoji);
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
  localStorage.removeItem(AVATAR_EMOJI_KEY);
}

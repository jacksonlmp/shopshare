import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserProfile } from '../types/domain';

const USER_ID_KEY = 'user_id';
const DISPLAY_NAME_KEY = 'display_name';
const AVATAR_EMOJI_KEY = 'avatar_emoji';

export async function getStoredUser(): Promise<UserProfile | null> {
  const [userId, displayName, avatarEmoji] = await Promise.all([
    AsyncStorage.getItem(USER_ID_KEY),
    AsyncStorage.getItem(DISPLAY_NAME_KEY),
    AsyncStorage.getItem(AVATAR_EMOJI_KEY),
  ]);

  if (!userId || !displayName || !avatarEmoji) {
    return null;
  }

  return { userId, displayName, avatarEmoji };
}

export async function saveStoredUser(user: UserProfile): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(USER_ID_KEY, user.userId),
    AsyncStorage.setItem(DISPLAY_NAME_KEY, user.displayName),
    AsyncStorage.setItem(AVATAR_EMOJI_KEY, user.avatarEmoji),
  ]);
}

import { useState, type JSX } from 'react';
import axios from 'axios';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '../services/api';
import { saveStoredUser } from '../services/storage';
import { useSessionStore } from '../state/useSessionStore';
import { colors } from '../theme/colors';

const emojis = ['😀', '😎', '🧠', '🎯', '🚀', '🛒'];

export function OnboardingScreen(): JSX.Element {
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😀');
  const setUser = useSessionStore(
    (state: ReturnType<typeof useSessionStore.getState>) => state.setUser,
  );

  async function submit(): Promise<void> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }

    try {
      const response = await api.post('/api/users', {
        display_name: trimmed,
        avatar_emoji: avatarEmoji,
      });

      const user = {
        userId: response.data.id as string,
        displayName: response.data.display_name as string,
        avatarEmoji: response.data.avatar_emoji as string,
      };

      await saveStoredUser(user);
      setUser(user);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('[onboarding] create user failed', {
          status,
          data,
          message,
        });

        const details = status ? `HTTP ${status}` : message;
        Alert.alert('Error', `Failed to create user. ${details}`);
        return;
      }

      console.error('[onboarding] create user unexpected error', error);
      Alert.alert('Error', 'Failed to create user.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ShopShare</Text>
      <Text style={styles.subtitle}>Pick a name and an avatar to start.</Text>

      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.emojiRow}>
        {emojis.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => setAvatarEmoji(emoji)}
            style={[styles.emojiButton, avatarEmoji === emoji ? styles.emojiButtonActive : null]}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.submitButton} onPress={submit}>
        <Text style={styles.submitButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  emojiButtonActive: {
    borderColor: colors.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});

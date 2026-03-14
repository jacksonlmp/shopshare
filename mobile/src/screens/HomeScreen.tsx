import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSessionStore } from '../state/useSessionStore';
import { colors } from '../theme/colors';

export function HomeScreen(): JSX.Element {
  const user = useSessionStore(
    (state: ReturnType<typeof useSessionStore.getState>) => state.user,
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>
        Logged in as {user?.avatarEmoji} {user?.displayName}
      </Text>
      <Text style={styles.text}>Next step: lists and item flows.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

import { useEffect, type JSX } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './navigation/RootNavigator';
import { getStoredUser } from './services/storage';
import { useSessionStore } from './state/useSessionStore';
import { colors } from './theme/colors';

export function AppRoot(): JSX.Element {
  const isBootstrapping = useSessionStore(
    (state: ReturnType<typeof useSessionStore.getState>) => state.isBootstrapping,
  );
  const setBootstrapping = useSessionStore(
    (state: ReturnType<typeof useSessionStore.getState>) => state.setBootstrapping,
  );
  const setUser = useSessionStore(
    (state: ReturnType<typeof useSessionStore.getState>) => state.setUser,
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrap(): Promise<void> {
      const user = await getStoredUser();
      if (!isMounted) {
        return;
      }
      setUser(user);
      setBootstrapping(false);
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setBootstrapping, setUser]);

  if (isBootstrapping) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

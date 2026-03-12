import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:shopshare/services/api_client.dart';
import 'package:shopshare/services/local_storage_service.dart';

/// Holds the [SharedPreferences] instance initialised at app start.
/// Must be overridden in [ProviderScope] before the app runs.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError(
    'sharedPreferencesProvider must be overridden in main.dart.',
  ),
);

/// Provides a fully configured [ApiClient] using the stored user id interceptor.
final apiClientProvider = Provider<ApiClient>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ApiClient.create(prefs);
});

/// Provides a [LocalStorageService] backed by the stored [SharedPreferences].
final localStorageServiceProvider = Provider<LocalStorageService>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return LocalStorageService(prefs);
});

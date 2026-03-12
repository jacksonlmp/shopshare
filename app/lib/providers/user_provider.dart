import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shopshare/providers/api_client_provider.dart';

/// A lightweight snapshot of the currently logged-in user, read from
/// [LocalStorageService]. Null when the user has not completed onboarding yet.
typedef CurrentUser = ({
  String userId,
  String displayName,
  String avatarEmoji,
});

final currentUserProvider = Provider<CurrentUser?>((ref) {
  final storage = ref.watch(localStorageServiceProvider);
  if (!storage.hasUser) return null;
  return (
    userId: storage.userId!,
    displayName: storage.displayName!,
    avatarEmoji: storage.avatarEmoji!,
  );
});

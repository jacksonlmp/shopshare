import 'package:shared_preferences/shared_preferences.dart';

/// Central definition of all SharedPreferences keys.
/// Must stay in sync with the private constant in [ApiClient].
abstract final class LocalStorageKeys {
  static const String userId = 'user_id';
  static const String displayName = 'display_name';
  static const String avatarEmoji = 'avatar_emoji';
}

class LocalStorageService {
  const LocalStorageService(this._prefs);

  final SharedPreferences _prefs;

  Future<void> saveUser({
    required String userId,
    required String displayName,
    required String avatarEmoji,
  }) async {
    await Future.wait([
      _prefs.setString(LocalStorageKeys.userId, userId),
      _prefs.setString(LocalStorageKeys.displayName, displayName),
      _prefs.setString(LocalStorageKeys.avatarEmoji, avatarEmoji),
    ]);
  }

  String? get userId => _prefs.getString(LocalStorageKeys.userId);
  String? get displayName => _prefs.getString(LocalStorageKeys.displayName);
  String? get avatarEmoji => _prefs.getString(LocalStorageKeys.avatarEmoji);
  bool get hasUser => userId != null;

  Future<void> clearUser() async {
    await Future.wait([
      _prefs.remove(LocalStorageKeys.userId),
      _prefs.remove(LocalStorageKeys.displayName),
      _prefs.remove(LocalStorageKeys.avatarEmoji),
    ]);
  }
}

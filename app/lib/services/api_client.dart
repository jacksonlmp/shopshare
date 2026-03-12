import 'dart:developer';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Resolves the API base URL at runtime:
// - Android emulator: 10.0.2.2 maps to the host machine's localhost.
// - All other platforms (Linux desktop, iOS simulator, etc.): use localhost.
// Move to AppConfig with --dart-define when environment configuration is added.
String get _kBaseUrl =>
    Platform.isAndroid ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

// SharedPreferences key — must match the value used in LocalStorageService.
const String _kUserIdKey = 'user_id';
const String _kUserIdHeader = 'X-User-Id';

class ApiClient {
  ApiClient._(this._dio);

  final Dio _dio;

  /// Creates a fully configured [ApiClient].
  ///
  /// [prefs] is used by the [_UserIdInterceptor] to read the current user's
  /// id on every request. It is expected to already be initialised.
  static ApiClient create(SharedPreferences prefs) {
    final Dio dio = Dio(
      BaseOptions(
        baseUrl: _kBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: const {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.addAll([_UserIdInterceptor(prefs), _ErrorInterceptor()]);

    return ApiClient._(dio);
  }

  Dio get dio => _dio;
}

/// Injects the locally stored user id into every outgoing request as the
/// [_kUserIdHeader] header. Silently skips if no user id has been saved yet
/// (e.g. during the onboarding flow before [POST /api/users] completes).
class _UserIdInterceptor extends Interceptor {
  const _UserIdInterceptor(this._prefs);

  final SharedPreferences _prefs;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final String? userId = _prefs.getString(_kUserIdKey);
    if (userId != null) {
      options.headers[_kUserIdHeader] = userId;
    }
    handler.next(options);
  }
}

/// Logs every [DioException] using [dart:developer] so errors appear in the
/// Flutter DevTools console without leaking to production stdout.
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    log(
      'HTTP error: ${err.response?.statusCode} '
      '${err.requestOptions.method} ${err.requestOptions.path}',
      error: err,
      stackTrace: err.stackTrace,
      name: 'ApiClient',
    );
    handler.next(err);
  }
}

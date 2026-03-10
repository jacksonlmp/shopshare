import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';

Handler middleware(Handler handler) {
  final db = AppDatabase();
  return handler
      .use(provider<AppDatabase>((_) => db))
      .use(_cors);
}

/// Adds CORS headers to every response and short-circuits OPTIONS preflight
/// requests with 204 No Content.
///
/// [_allowedOrigins] should be tightened to the production app URL before
/// deploying to production.
const _allowedOrigins = '*';
const _allowedMethods = 'GET, POST, PATCH, DELETE, OPTIONS';
const _allowedHeaders = 'Content-Type, X-User-Id';

Middleware get _cors => (handler) => (context) async {
      // Short-circuit preflight requests immediately.
      if (context.request.method == HttpMethod.options) {
        return Response(
          statusCode: HttpStatus.noContent,
          headers: _corsHeaders,
        );
      }

      final response = await handler(context);
      return response.copyWith(headers: {...response.headers, ..._corsHeaders});
    };

const _corsHeaders = {
  'Access-Control-Allow-Origin': _allowedOrigins,
  'Access-Control-Allow-Methods': _allowedMethods,
  'Access-Control-Allow-Headers': _allowedHeaders,
};

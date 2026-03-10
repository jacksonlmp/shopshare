import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';
import 'package:uuid/uuid.dart';

Future<Response> onRequest(RequestContext context) async {
  if (context.request.method == HttpMethod.post) {
    return _handlePost(context);
  }
  return Response(statusCode: HttpStatus.methodNotAllowed);
}

Future<Response> _handlePost(RequestContext context) async {
  final Map<String, dynamic> body;
  try {
    body = await context.request.json() as Map<String, dynamic>;
  } catch (_) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Invalid or missing JSON body.', 'code': 'INVALID_BODY'},
    );
  }

  final displayName = body['display_name'] as String?;
  final avatarEmoji = body['avatar_emoji'] as String?;
  final deviceToken = body['device_token'] as String?;

  if (displayName == null || displayName.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Field display_name is required.',
        'code': 'MISSING_DISPLAY_NAME',
      },
    );
  }

  if (avatarEmoji == null || avatarEmoji.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Field avatar_emoji is required.',
        'code': 'MISSING_AVATAR_EMOJI',
      },
    );
  }

  final db = context.read<AppDatabase>();
  final user = await db.usersDao.insertUser(
    id: const Uuid().v4(),
    displayName: displayName.trim(),
    avatarEmoji: avatarEmoji.trim(),
    deviceToken: deviceToken,
  );

  return Response.json(
    statusCode: HttpStatus.created,
    body: {
      'id': user.id,
      'display_name': user.displayName,
      'avatar_emoji': user.avatarEmoji,
      'device_token': user.deviceToken,
      'created_at': user.createdAt.toIso8601String(),
    },
  );
}

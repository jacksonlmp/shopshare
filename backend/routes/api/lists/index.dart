import 'dart:io';
import 'dart:math';

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

  final name = body['name'] as String?;
  final ownerId = body['owner_id'] as String?;

  if (name == null || name.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field name is required.', 'code': 'MISSING_NAME'},
    );
  }

  if (ownerId == null || ownerId.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field owner_id is required.', 'code': 'MISSING_OWNER'},
    );
  }

  final db = context.read<AppDatabase>();

  // Verify the owner exists.
  final owner = await db.usersDao.findById(ownerId);
  if (owner == null) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'User not found.', 'code': 'USER_NOT_FOUND'},
    );
  }

  // Generate a unique 6-character alphanumeric share_code.
  // Retry on the rare collision until a free code is found.
  final String shareCode;
  try {
    shareCode = await _generateUniqueShareCode(db);
  } catch (_) {
    return Response.json(
      statusCode: HttpStatus.internalServerError,
      body: {
        'error': 'Could not generate a unique share code.',
        'code': 'SHARE_CODE_EXHAUSTED',
      },
    );
  }

  final list = await db.listsDao.createList(
    id: const Uuid().v4(),
    name: name.trim(),
    shareCode: shareCode,
    ownerId: ownerId,
  );

  return Response.json(
    statusCode: HttpStatus.created,
    body: {
      'id': list.id,
      'name': list.name,
      'share_code': list.shareCode,
      'owner_id': list.ownerId,
      'is_archived': list.isArchived,
      'created_at': list.createdAt.toIso8601String(),
      'updated_at': list.updatedAt.toIso8601String(),
    },
  );
}

const _chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const _codeLength = 6;
const _maxAttempts = 10;

/// Generates a random 6-character alphanumeric code that does not already
/// exist in the database.
///
/// Uses a carefully chosen alphabet that avoids visually ambiguous characters:
/// no I/1, O/0.
Future<String> _generateUniqueShareCode(AppDatabase db) async {
  final rand = Random.secure();
  for (var attempt = 0; attempt < _maxAttempts; attempt++) {
    final code = List.generate(
      _codeLength,
      (_) => _chars[rand.nextInt(_chars.length)],
    ).join();

    final existing = await db.listsDao.findByShareCode(code);
    if (existing == null) return code;
  }
  throw StateError('Could not generate unique share_code after $_maxAttempts attempts.');
}

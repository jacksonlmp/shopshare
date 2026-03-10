import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';

Future<Response> onRequest(RequestContext context, String id) async {
  if (context.request.method == HttpMethod.patch) {
    return _handlePatch(context, id);
  }
  if (context.request.method == HttpMethod.delete) {
    return _handleDelete(context, id);
  }
  return Response(statusCode: HttpStatus.methodNotAllowed);
}

// PATCH /api/items/:id/check  →  mark or unmark an item
Future<Response> _handlePatch(RequestContext context, String id) async {
  final Map<String, dynamic> body;
  try {
    body = await context.request.json() as Map<String, dynamic>;
  } catch (_) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Invalid or missing JSON body.', 'code': 'INVALID_BODY'},
    );
  }

  final isChecked = body['is_checked'] as bool?;
  final checkedBy = body['checked_by'] as String?;

  if (isChecked == null) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Field is_checked is required.',
        'code': 'MISSING_IS_CHECKED',
      },
    );
  }

  if (isChecked && (checkedBy == null || checkedBy.trim().isEmpty)) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Field checked_by is required when checking an item.',
        'code': 'MISSING_CHECKED_BY',
      },
    );
  }

  final db = context.read<AppDatabase>();

  final existing = await db.itemsDao.findById(id);
  if (existing == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'Item not found.', 'code': 'ITEM_NOT_FOUND'},
    );
  }

  final updated = await db.itemsDao.checkItem(
    id: id,
    isChecked: isChecked,
    checkedBy: isChecked ? checkedBy : null,
  );

  return Response.json(
    body: {
      'id': updated.id,
      'list_id': updated.listId,
      'name': updated.name,
      'is_checked': updated.isChecked,
      'checked_by': updated.checkedBy,
      'checked_at': updated.checkedAt?.toIso8601String(),
    },
  );
}

// DELETE /api/items/:id  →  remove item (only added_by or list owner)
Future<Response> _handleDelete(RequestContext context, String id) async {
  final userId = context.request.headers['X-User-Id'];
  if (userId == null || userId.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Header X-User-Id is required.',
        'code': 'MISSING_USER_ID',
      },
    );
  }

  final db = context.read<AppDatabase>();

  final item = await db.itemsDao.findById(id);
  if (item == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'Item not found.', 'code': 'ITEM_NOT_FOUND'},
    );
  }

  // Allow: item creator OR list owner.
  if (item.addedBy != userId) {
    final list = await db.listsDao.findById(item.listId);
    if (list == null || list.ownerId != userId) {
      return Response.json(
        statusCode: HttpStatus.forbidden,
        body: {
          'error': 'Only the item creator or list owner can delete this item.',
          'code': 'FORBIDDEN',
        },
      );
    }
  }

  await db.itemsDao.deleteItem(id);

  return Response(statusCode: HttpStatus.noContent);
}

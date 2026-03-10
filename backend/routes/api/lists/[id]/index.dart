import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';

Future<Response> onRequest(RequestContext context, String id) async {
  if (context.request.method == HttpMethod.get) {
    return _handleGet(context, id);
  }
  if (context.request.method == HttpMethod.patch) {
    return _handlePatch(context, id);
  }
  return Response(statusCode: HttpStatus.methodNotAllowed);
}

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

  final userId = body['user_id'] as String?;
  if (userId == null || userId.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field user_id is required.', 'code': 'MISSING_USER_ID'},
    );
  }

  final newName       = body['name'] as String?;
  final isArchived    = body['is_archived'] as bool?;

  if (newName == null && isArchived == null) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Provide at least one of: name, is_archived.',
        'code': 'NO_FIELDS_TO_UPDATE',
      },
    );
  }

  if (newName != null && newName.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field name cannot be empty.', 'code': 'INVALID_NAME'},
    );
  }

  final db = context.read<AppDatabase>();

  final list = await db.listsDao.findById(id);
  if (list == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'List not found.', 'code': 'LIST_NOT_FOUND'},
    );
  }

  if (list.ownerId != userId) {
    return Response.json(
      statusCode: HttpStatus.forbidden,
      body: {'error': 'Only the owner can modify this list.', 'code': 'NOT_OWNER'},
    );
  }

  var updated = list;
  if (newName != null) {
    updated = await db.listsDao.updateName(id, newName.trim());
  }
  if (isArchived != null) {
    updated = await db.listsDao.setArchived(id, archived: isArchived);
  }

  return Response.json(
    body: {
      'id': updated.id,
      'name': updated.name,
      'share_code': updated.shareCode,
      'owner_id': updated.ownerId,
      'is_archived': updated.isArchived,
      'created_at': updated.createdAt.toIso8601String(),
      'updated_at': updated.updatedAt.toIso8601String(),
    },
  );
}

Future<Response> _handleGet(RequestContext context, String id) async {
  final db = context.read<AppDatabase>();

  final list = await db.listsDao.findById(id);
  if (list == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'List not found.', 'code': 'LIST_NOT_FOUND'},
    );
  }

  final membersWithUsers = await db.listsDao.getMembersWithUsers(id);
  final itemsWithDetails = await db.itemsDao.getItemsWithDetails(id);

  return Response.json(
    body: {
      'id': list.id,
      'name': list.name,
      'share_code': list.shareCode,
      'owner_id': list.ownerId,
      'is_archived': list.isArchived,
      'created_at': list.createdAt.toIso8601String(),
      'updated_at': list.updatedAt.toIso8601String(),
      'members': membersWithUsers.map((m) {
        final (:member, :user) = m;
        return {
          'user_id': user.id,
          'display_name': user.displayName,
          'avatar_emoji': user.avatarEmoji,
          'role': member.role.name,
          'joined_at': member.joinedAt.toIso8601String(),
        };
      }).toList(),
      'items': itemsWithDetails.map((d) {
        final (:item, :addedByUser, :category) = d;
        return {
          'id': item.id,
          'name': item.name,
          'quantity': item.quantity,
          'unit': item.unit,
          'note': item.note,
          'is_checked': item.isChecked,
          'checked_by': item.checkedBy,
          'checked_at': item.checkedAt?.toIso8601String(),
          'sort_order': item.sortOrder,
          'created_at': item.createdAt.toIso8601String(),
          'added_by': {
            'user_id': addedByUser.id,
            'display_name': addedByUser.displayName,
            'avatar_emoji': addedByUser.avatarEmoji,
          },
          'category': category == null
              ? null
              : {
                  'id': category.id,
                  'name': category.name,
                  'emoji': category.emoji,
                  'color_hex': category.colorHex,
                },
        };
      }).toList(),
    },
  );
}

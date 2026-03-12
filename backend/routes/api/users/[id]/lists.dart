import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';

/// GET /api/users/:id/lists
///
/// Returns a summary of all lists (active and archived) the user belongs to,
/// ordered by creation date descending. Each entry includes the full members
/// array and items array so the client can compute counters locally.
Future<Response> onRequest(RequestContext context, String id) async {
  if (context.request.method != HttpMethod.get) {
    return Response(statusCode: HttpStatus.methodNotAllowed);
  }

  final db = context.read<AppDatabase>();

  final user = await db.usersDao.findById(id);
  if (user == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'User not found.', 'code': 'USER_NOT_FOUND'},
    );
  }

  // All list_member rows for this user.
  final memberRows = await db.listsDao.getMembersByUser(id);

  final List<Map<String, dynamic>> result = [];

  for (final memberRow in memberRows) {
    final list = await db.listsDao.findById(memberRow.listId);
    if (list == null) continue;

    final membersWithUsers =
        await db.listsDao.getMembersWithUsers(memberRow.listId);
    final itemsWithDetails =
        await db.itemsDao.getItemsWithDetails(memberRow.listId);

    result.add({
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
    });
  }

  // Sort: most recently updated first.
  result.sort((a, b) {
    final aTime = DateTime.parse(a['updated_at'] as String);
    final bTime = DateTime.parse(b['updated_at'] as String);
    return bTime.compareTo(aTime);
  });

  return Response.json(body: result);
}

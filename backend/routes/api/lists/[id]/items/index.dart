import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';
import 'package:uuid/uuid.dart';

Future<Response> onRequest(RequestContext context, String id) async {
  if (context.request.method == HttpMethod.post) {
    return _handlePost(context, id);
  }
  return Response(statusCode: HttpStatus.methodNotAllowed);
}

Future<Response> _handlePost(RequestContext context, String listId) async {
  final Map<String, dynamic> body;
  try {
    body = await context.request.json() as Map<String, dynamic>;
  } catch (_) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Invalid or missing JSON body.', 'code': 'INVALID_BODY'},
    );
  }

  final addedBy = body['added_by'] as String?;
  final name = body['name'] as String?;

  if (addedBy == null || addedBy.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Field added_by is required.',
        'code': 'MISSING_ADDED_BY'
      },
    );
  }

  if (name == null || name.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field name is required.', 'code': 'MISSING_NAME'},
    );
  }

  final quantity = (body['quantity'] as num?)?.toDouble() ?? 1.0;
  final unit = body['unit'] as String?;
  final note = body['note'] as String?;
  final categoryId = body['category_id'] as int?;

  if (quantity <= 0) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {
        'error': 'Field quantity must be greater than zero.',
        'code': 'INVALID_QUANTITY',
      },
    );
  }

  final db = context.read<AppDatabase>();

  final list = await db.listsDao.findById(listId);
  if (list == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'List not found.', 'code': 'LIST_NOT_FOUND'},
    );
  }

  final isMember = await db.listsDao.isMember(
    listId: listId,
    userId: addedBy,
  );
  if (!isMember) {
    return Response.json(
      statusCode: HttpStatus.forbidden,
      body: {
        'error': 'User is not a member of this list.',
        'code': 'NOT_A_MEMBER',
      },
    );
  }

  final item = await db.itemsDao.insertItem(
    id: const Uuid().v4(),
    listId: listId,
    addedBy: addedBy,
    name: name.trim(),
    quantity: quantity,
    unit: unit,
    note: note,
    categoryId: categoryId,
  );

  return Response.json(
    statusCode: HttpStatus.created,
    body: {
      'id': item.id,
      'list_id': item.listId,
      'name': item.name,
      'quantity': item.quantity,
      'unit': item.unit,
      'note': item.note,
      'category_id': item.categoryId,
      'is_checked': item.isChecked,
      'sort_order': item.sortOrder,
      'added_by': item.addedBy,
      'created_at': item.createdAt.toIso8601String(),
    },
  );
}

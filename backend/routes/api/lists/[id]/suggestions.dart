import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';

Future<Response> onRequest(RequestContext context, String id) async {
  if (context.request.method == HttpMethod.get) {
    return _handleGet(context, id);
  }
  return Response(statusCode: HttpStatus.methodNotAllowed);
}

Future<Response> _handleGet(RequestContext context, String listId) async {
  final db = context.read<AppDatabase>();

  final list = await db.listsDao.findById(listId);
  if (list == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'List not found.', 'code': 'LIST_NOT_FOUND'},
    );
  }

  final suggestions = await db.itemsDao.getSuggestions(listId);

  return Response.json(
    body: suggestions.map((h) => {
      'item_name': h.itemName,
      'times_added': h.timesAdded,
      'category_id': h.categoryId,
      'last_used_at': h.lastUsedAt.toIso8601String(),
    }).toList(),
  );
}

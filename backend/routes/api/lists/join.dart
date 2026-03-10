import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:backend/database/tables/list_members.dart';
import 'package:dart_frog/dart_frog.dart';

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

  final shareCode = body['share_code'] as String?;
  final userId = body['user_id'] as String?;

  if (shareCode == null || shareCode.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field share_code is required.', 'code': 'MISSING_SHARE_CODE'},
    );
  }

  if (userId == null || userId.trim().isEmpty) {
    return Response.json(
      statusCode: HttpStatus.badRequest,
      body: {'error': 'Field user_id is required.', 'code': 'MISSING_USER_ID'},
    );
  }

  final db = context.read<AppDatabase>();

  final list = await db.listsDao.findByShareCode(shareCode.trim().toUpperCase());
  if (list == null) {
    return Response.json(
      statusCode: HttpStatus.notFound,
      body: {'error': 'List not found.', 'code': 'LIST_NOT_FOUND'},
    );
  }

  final alreadyMember = await db.listsDao.isMember(
    listId: list.id,
    userId: userId,
  );
  if (alreadyMember) {
    return Response.json(
      statusCode: HttpStatus.conflict,
      body: {'error': 'User is already a member of this list.', 'code': 'ALREADY_MEMBER'},
    );
  }

  await db.listsDao.addMember(
    listId: list.id,
    userId: userId,
    role: ListMemberRole.member,
  );

  return Response.json(
    statusCode: HttpStatus.ok,
    body: {'list_id': list.id},
  );
}

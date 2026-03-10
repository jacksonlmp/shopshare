import 'dart:io';

import 'package:dart_frog/dart_frog.dart';

Future<Response> onRequest(RequestContext context) async {
  if (context.request.method != HttpMethod.get) {
    return Response(statusCode: HttpStatus.methodNotAllowed);
  }

  final file = File('public/openapi.yaml');
  if (!file.existsSync()){
    return Response(statusCode: HttpStatus.notFound, body: 'openapi.yaml not found');
  }

  return Response(
    statusCode: HttpStatus.ok,
    headers: {
      'Content-Type': 'application/yaml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: await file.readAsString(),
  );
}

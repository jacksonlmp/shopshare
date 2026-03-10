import 'dart:io';

import 'package:dart_frog/dart_frog.dart';

Future<Response> onRequest(RequestContext context) async {
  if (context.request.method != HttpMethod.get) {
    return Response(statusCode: HttpStatus.methodNotAllowed);
  }

  return Response(
    statusCode: HttpStatus.ok,
    headers: {'Content-Type': 'text/html; charset=utf-8'},
    body: '''<!doctype html>
<html>
  <head>
    <title>ShopShare API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="http://localhost:8080/openapi"
      data-configuration=\'{"theme":"purple","layout":"modern"}\'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>''',
  );
}

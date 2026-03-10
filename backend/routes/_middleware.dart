import 'package:backend/database/app_database.dart';
import 'package:dart_frog/dart_frog.dart';

/// Provides the [AppDatabase] singleton to every route in the application.
///
/// The singleton is created once (lazy) and held for the lifetime of the
/// server process. Category seed data is also applied once on first init,
/// handled internally by [AppDatabase].
Handler middleware(Handler handler) {
  final db = AppDatabase();
  return handler.use(provider<AppDatabase>((_) => db));
}

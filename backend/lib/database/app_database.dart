import 'dart:io';

import 'package:backend/database/tables/categories.dart';
import 'package:backend/database/tables/users.dart';
import 'package:drift/drift.dart';
import 'package:drift_postgres/drift_postgres.dart';
import 'package:postgres/postgres.dart';

part 'app_database.g.dart';

/// Singleton Drift database connected to PostgreSQL.
///
/// Usage:
/// ```dart
/// final db = AppDatabase.instance;
/// ```
@DriftDatabase(tables: [Users, Categories])
class AppDatabase extends _$AppDatabase {
  /// Creates or returns the singleton instance of [AppDatabase].
  factory AppDatabase() {
    _instance ??= AppDatabase._internal(_openConnection());
    return _instance!;
  }

  AppDatabase._internal(super.e);

  static AppDatabase? _instance;

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
      );
}

/// Opens a PostgreSQL connection using the DATABASE_URL environment variable.
///
/// Expected format:
///   postgresql://user:password@host:port/database
PgDatabase _openConnection() {
  final rawUrl = Platform.environment['DATABASE_URL'] ??
      'postgresql://shopuser:shoppassword@localhost:5432/shopshare';
  final url = Uri.parse(rawUrl);

  return PgDatabase(
    endpoint: Endpoint(
      host: url.host,
      port: url.hasPort ? url.port : 5432,
      database: url.pathSegments.first,
      username: url.userInfo.split(':').first,
      password: url.userInfo.contains(':')
          ? Uri.decodeComponent(url.userInfo.split(':').last)
          : null,
    ),
    settings: const ConnectionSettings(sslMode: SslMode.disable),
  );
}

import 'dart:io';

import 'package:backend/database/daos/items_dao.dart';
import 'package:backend/database/daos/lists_dao.dart';
import 'package:backend/database/daos/users_dao.dart';
import 'package:backend/database/seed/categories_seed.dart';
import 'package:backend/database/tables/categories.dart';
import 'package:backend/database/tables/item_history.dart';
import 'package:backend/database/tables/items.dart';
import 'package:backend/database/tables/list_members.dart';
import 'package:backend/database/tables/lists.dart';
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
@DriftDatabase(
  tables: [Users, Lists, ListMembers, Categories, Items, ItemHistory],
  daos: [UsersDao, ListsDao, ItemsDao],
)
class AppDatabase extends _$AppDatabase {
  /// Creates or returns the singleton instance of [AppDatabase].
  factory AppDatabase() {
    _instance ??= AppDatabase._internal(_openConnection()).._seed();
    return _instance!;
  }

  /// For use in tests only — bypasses the singleton and skips seeding.
  factory AppDatabase.forTesting(QueryExecutor executor) =>
      AppDatabase._internal(executor);

  AppDatabase._internal(super.e);

  static AppDatabase? _instance;

  void _seed() => seedCategories(this).catchError((_) {});

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          // v1 → v2: added lists and list_members tables
          if (from < 2) {
            await m.createTable(lists);
            await m.createTable(listMembers);
          }
          // v2 → v3: added items and item_history tables
          if (from < 3) {
            await m.createTable(items);
            await m.createTable(itemHistory);
          }
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

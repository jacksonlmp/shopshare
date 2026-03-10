import 'dart:io';

import 'package:backend/database/app_database.dart';
import 'package:drift_postgres/drift_postgres.dart';
import 'package:postgres/postgres.dart';
import 'package:test/test.dart';
import 'package:uuid/uuid.dart';

/// Integration tests for UsersDao, ListsDao, and ItemsDao.
///
/// Requires a running PostgreSQL instance. Set DATABASE_URL or use the
/// default: postgresql://shopuser:shoppassword@localhost:5432/shopshare
///
/// Run with: dart test test/database_test.dart
void main() {
  late AppDatabase db;
  const uuid = Uuid();

  // Unique prefix per run so tests never collide with pre-existing data.
  final runId = uuid.v4().substring(0, 8);

  setUpAll(() {
    final rawUrl = Platform.environment['DATABASE_URL'] ??
        'postgresql://shopuser:shoppassword@localhost:5432/shopshare';
    final url = Uri.parse(rawUrl);

    db = AppDatabase.forTesting(
      PgDatabase(
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
      ),
    );
  });

  tearDownAll(() async => db.close());

  // ── Helpers ──────────────────────────────────────────────────────────────

  String userId() => 'test_user_$runId';
  String listId() => 'test_list_$runId';
  String itemId() => 'test_item_$runId';
  String shareCode() => runId.substring(0, 6).toUpperCase();

  Future<void> cleanUp() async {
    await (db.delete(db.items)..where((t) => t.id.equals(itemId()))).go();
    await (db.delete(db.listMembers)..where((t) => t.listId.equals(listId())))
        .go();
    await (db.delete(db.lists)..where((t) => t.id.equals(listId()))).go();
    await (db.delete(db.users)..where((t) => t.id.equals(userId()))).go();
  }

  setUp(cleanUp);
  tearDown(cleanUp);

  // ── UsersDao ─────────────────────────────────────────────────────────────

  group('UsersDao', () {
    test('should insert and find a user by id', () async {
      await db.usersDao.insertUser(
        id: userId(),
        displayName: 'Alice',
        avatarEmoji: '🛒',
      );

      final found = await db.usersDao.findById(userId());

      expect(found, isNotNull);
      expect(found!.displayName, 'Alice');
      expect(found.avatarEmoji, '🛒');
    });

    test('should return null when user does not exist', () async {
      final found = await db.usersDao.findById('non_existent_id');
      expect(found, isNull);
    });
  });

  // ── ListsDao ─────────────────────────────────────────────────────────────

  group('ListsDao', () {
    setUp(() async {
      await db.usersDao.insertUser(
        id: userId(),
        displayName: 'Alice',
        avatarEmoji: '🛒',
      );
    });

    test('should create a list and add owner as member', () async {
      await db.listsDao.createList(
        id: listId(),
        name: 'Weekly Shop',
        shareCode: shareCode(),
        ownerId: userId(),
      );

      final found = await db.listsDao.findById(listId());
      expect(found, isNotNull);
      expect(found!.name, 'Weekly Shop');
      expect(found.shareCode, shareCode());

      final isMember = await db.listsDao.isMember(
        listId: listId(),
        userId: userId(),
      );
      expect(isMember, isTrue);
    });

    test('should find a list by share_code', () async {
      await db.listsDao.createList(
        id: listId(),
        name: 'Weekly Shop',
        shareCode: shareCode(),
        ownerId: userId(),
      );

      final found = await db.listsDao.findByShareCode(shareCode());
      expect(found, isNotNull);
      expect(found!.id, listId());
    });

    test('should return null for unknown share_code', () async {
      final found = await db.listsDao.findByShareCode('ZZ9ZZ9');
      expect(found, isNull);
    });

    test('should update list name', () async {
      await db.listsDao.createList(
        id: listId(),
        name: 'Weekly Shop',
        shareCode: shareCode(),
        ownerId: userId(),
      );

      final updated = await db.listsDao.updateName(listId(), 'Monthly Shop');
      expect(updated.name, 'Monthly Shop');
    });
  });

  // ── ItemsDao ─────────────────────────────────────────────────────────────

  group('ItemsDao', () {
    setUp(() async {
      await db.usersDao.insertUser(
        id: userId(),
        displayName: 'Alice',
        avatarEmoji: '🛒',
      );
      await db.listsDao.createList(
        id: listId(),
        name: 'Weekly Shop',
        shareCode: shareCode(),
        ownerId: userId(),
      );
    });

    test('should insert an item and retrieve it by list', () async {
      await db.itemsDao.insertItem(
        id: itemId(),
        listId: listId(),
        addedBy: userId(),
        name: 'Milk',
        quantity: 2,
        unit: 'L',
      );

      final items = await db.itemsDao.getByList(listId());
      expect(items, hasLength(1));
      expect(items.first.name, 'Milk');
      expect(items.first.quantity, 2.0);
      expect(items.first.isChecked, isFalse);
    });

    test('should check and uncheck an item', () async {
      await db.itemsDao.insertItem(
        id: itemId(),
        listId: listId(),
        addedBy: userId(),
        name: 'Milk',
        quantity: 1,
      );

      final checked = await db.itemsDao.checkItem(
        id: itemId(),
        isChecked: true,
        checkedBy: userId(),
      );
      expect(checked.isChecked, isTrue);
      expect(checked.checkedBy, userId());
      expect(checked.checkedAt, isNotNull);

      final unchecked = await db.itemsDao.checkItem(
        id: itemId(),
        isChecked: false,
        checkedBy: null,
      );
      expect(unchecked.isChecked, isFalse);
      expect(unchecked.checkedBy, isNull);
      expect(unchecked.checkedAt, isNull);
    });

    test('should delete an item', () async {
      await db.itemsDao.insertItem(
        id: itemId(),
        listId: listId(),
        addedBy: userId(),
        name: 'Milk',
        quantity: 1,
      );

      final deleted = await db.itemsDao.deleteItem(itemId());
      expect(deleted, 1);

      final items = await db.itemsDao.getByList(listId());
      expect(items, isEmpty);
    });
  });
}

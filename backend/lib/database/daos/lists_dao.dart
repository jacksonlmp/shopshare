import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/list_members.dart';
import '../tables/lists.dart';

part 'lists_dao.g.dart';

@DriftAccessor(tables: [Lists, ListMembers])
class ListsDao extends DatabaseAccessor<AppDatabase> with _$ListsDaoMixin {
  ListsDao(super.db);

  Future<ShoppingList?> findById(String id) =>
      (select(lists)..where((t) => t.id.equals(id))).getSingleOrNull();

  Future<ShoppingList?> findByShareCode(String shareCode) =>
      (select(lists)..where((t) => t.shareCode.equals(shareCode)))
          .getSingleOrNull();

  /// Creates a list and inserts the creator as owner in a single transaction.
  Future<ShoppingList> createList({
    required String id,
    required String name,
    required String shareCode,
    required String ownerId,
  }) =>
      transaction(() async {
        final now = DateTime.now().toUtc();
        final list = await into(lists).insertReturning(
          ListsCompanion.insert(
            id: id,
            name: name,
            shareCode: shareCode,
            ownerId: ownerId,
            createdAt: now,
            updatedAt: now,
          ),
        );
        await into(listMembers).insert(
          ListMembersCompanion.insert(
            listId: id,
            userId: ownerId,
            role: ListMemberRole.owner,
            joinedAt: now,
          ),
        );
        return list;
      });

  Future<ShoppingList> updateName(String id, String name) =>
      (update(lists)..where((t) => t.id.equals(id)))
          .writeReturning(
            ListsCompanion(
              name: Value(name),
              updatedAt: Value(DateTime.now().toUtc()),
            ),
          )
          .then((rows) => rows.first);

  Future<ShoppingList> setArchived(String id, {required bool archived}) =>
      (update(lists)..where((t) => t.id.equals(id)))
          .writeReturning(
            ListsCompanion(
              isArchived: Value(archived),
              updatedAt: Value(DateTime.now().toUtc()),
            ),
          )
          .then((rows) => rows.first);

  Future<void> addMember({
    required String listId,
    required String userId,
    required ListMemberRole role,
  }) =>
      into(listMembers).insert(
        ListMembersCompanion.insert(
          listId: listId,
          userId: userId,
          role: role,
          joinedAt: DateTime.now().toUtc(),
        ),
      );

  Future<bool> isMember({
    required String listId,
    required String userId,
  }) async {
    final row = await (select(listMembers)
          ..where(
            (t) => t.listId.equals(listId) & t.userId.equals(userId),
          ))
        .getSingleOrNull();
    return row != null;
  }

  Future<List<ListMember>> getMembersByList(String listId) =>
      (select(listMembers)..where((t) => t.listId.equals(listId))).get();
}

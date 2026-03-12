import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/list_members.dart';
import '../tables/lists.dart';
import '../tables/users.dart';

part 'lists_dao.g.dart';

/// Holds a [ListMember] row joined with its corresponding [User].
typedef MemberWithUser = ({ListMember member, User user});

@DriftAccessor(tables: [Lists, ListMembers, Users])
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

  Future<List<MemberWithUser>> getMembersWithUsers(String listId) {
    final query = select(listMembers).join([
      innerJoin(users, users.id.equalsExp(listMembers.userId)),
    ])
      ..where(listMembers.listId.equals(listId));

    return query
        .map(
          (row) => (
            member: row.readTable(listMembers),
            user: row.readTable(users),
          ),
        )
        .get();
  }

  Future<List<ListMember>> getMembersByList(String listId) =>
      (select(listMembers)..where((t) => t.listId.equals(listId))).get();

  /// Returns all [ListMember] rows where [userId] is a member.
  /// Used by GET /api/users/:id/lists to enumerate a user's lists.
  Future<List<ListMember>> getMembersByUser(String userId) =>
      (select(listMembers)..where((t) => t.userId.equals(userId))).get();
}

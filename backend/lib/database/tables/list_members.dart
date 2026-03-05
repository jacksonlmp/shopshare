import 'package:drift/drift.dart';

import 'lists.dart';
import 'users.dart';

/// The role a user can hold within a shopping list.
enum ListMemberRole {
  /// Created the list. Can rename, archive, and remove members.
  owner,

  /// Joined via share code. Can add, check, and delete their own items.
  member,
}

/// Table: list_members
///
/// Junction table that links [Users] to [Lists].
/// A user can belong to many lists; a list can have many users.
/// The [role] column distinguishes the owner from regular members.
@DataClassName('ListMember')
class ListMembers extends Table {
  /// FK → lists.id
  TextColumn get listId => text().references(Lists, #id)();

  /// FK → users.id
  TextColumn get userId => text().references(Users, #id)();

  /// Whether the user created the list (owner) or joined it (member).
  /// Stored as the enum name string (e.g. "owner" / "member").
  TextColumn get role => textEnum<ListMemberRole>()();

  /// Timestamp of when the user joined or was set as owner (UTC).
  DateTimeColumn get joinedAt =>
      dateTime().withDefault(currentDateAndTime)();

  /// Composite primary key — a user can only appear once per list.
  @override
  Set<Column> get primaryKey => {listId, userId};
}

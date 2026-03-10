import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/users.dart';

part 'users_dao.g.dart';

@DriftAccessor(tables: [Users])
class UsersDao extends DatabaseAccessor<AppDatabase> with _$UsersDaoMixin {
  UsersDao(super.db);

  Future<User?> findById(String id) =>
      (select(users)..where((t) => t.id.equals(id))).getSingleOrNull();

  Future<User> insertUser({
    required String id,
    required String displayName,
    required String avatarEmoji,
    String? deviceToken,
  }) =>
      into(users).insertReturning(
        UsersCompanion.insert(
          id: id,
          displayName: displayName,
          avatarEmoji: avatarEmoji,
          deviceToken: Value(deviceToken),
          createdAt: DateTime.now().toUtc(),
        ),
      );

  Future<User> updateDeviceToken(String id, String deviceToken) =>
      (update(users)..where((t) => t.id.equals(id)))
          .writeReturning(UsersCompanion(deviceToken: Value(deviceToken)))
          .then((rows) => rows.first);
}

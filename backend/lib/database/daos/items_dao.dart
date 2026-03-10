import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/item_history.dart';
import '../tables/items.dart';

part 'items_dao.g.dart';

@DriftAccessor(tables: [Items, ItemHistory])
class ItemsDao extends DatabaseAccessor<AppDatabase> with _$ItemsDaoMixin {
  ItemsDao(super.db);

  Future<Item?> findById(String id) =>
      (select(items)..where((t) => t.id.equals(id))).getSingleOrNull();

  Future<List<Item>> getByList(String listId) => (select(items)
        ..where((t) => t.listId.equals(listId))
        ..orderBy([(t) => OrderingTerm.asc(t.sortOrder)]))
      .get();

  /// Inserts the item and upserts its frequency in [item_history].
  Future<Item> insertItem({
    required String id,
    required String listId,
    required String addedBy,
    required String name,
    required double quantity,
    String? unit,
    String? note,
    int? categoryId,
  }) =>
      transaction(() async {
        final now = DateTime.now().toUtc();
        final item = await into(items).insertReturning(
          ItemsCompanion.insert(
            id: id,
            listId: listId,
            addedBy: addedBy,
            name: name,
            quantity: Value(quantity),
            unit: Value(unit),
            note: Value(note),
            categoryId: Value(categoryId),
            createdAt: now,
          ),
        );

        // Upsert history: increment count if the name was added before,
        // otherwise insert a new entry with count = 1.
        final existing = await (select(itemHistory)
              ..where(
                (t) => t.listId.equals(listId) & t.itemName.equals(name),
              ))
            .getSingleOrNull();

        if (existing != null) {
          await (update(itemHistory)..where((t) => t.id.equals(existing.id)))
              .write(
            ItemHistoryCompanion(
              timesAdded: Value(existing.timesAdded + 1),
              categoryId: Value(categoryId),
              lastUsedAt: Value(now),
            ),
          );
        } else {
          await into(itemHistory).insert(
            ItemHistoryCompanion.insert(
              listId: listId,
              itemName: name,
              categoryId: Value(categoryId),
              lastUsedAt: now,
            ),
          );
        }

        return item;
      });

  /// Sets [isChecked] and updates [checkedBy] / [checkedAt] accordingly.
  /// Pass [checkedBy] as null when unchecking.
  Future<Item> checkItem({
    required String id,
    required bool isChecked,
    required String? checkedBy,
  }) {
    final now = isChecked ? Value(DateTime.now().toUtc()) : const Value(null);
    return (update(items)..where((t) => t.id.equals(id)))
        .writeReturning(
          ItemsCompanion(
            isChecked: Value(isChecked),
            checkedBy: Value(checkedBy),
            checkedAt: now,
          ),
        )
        .then((rows) => rows.first);
  }

  Future<int> deleteItem(String id) =>
      (delete(items)..where((t) => t.id.equals(id))).go();

  /// Returns suggestions ordered by frequency descending.
  Future<List<ItemHistoryEntry>> getSuggestions(String listId,
          {int limit = 10}) =>
      (select(itemHistory)
            ..where((t) => t.listId.equals(listId))
            ..orderBy([(t) => OrderingTerm.desc(t.timesAdded)])
            ..limit(limit))
          .get();
}

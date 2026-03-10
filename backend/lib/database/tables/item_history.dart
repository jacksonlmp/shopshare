import 'package:drift/drift.dart';

import 'categories.dart';
import 'lists.dart';

/// Table: item_history
///
/// Tracks how often a given item name has been added to a specific list.
/// Used by the suggestions endpoint to surface frequently used items when
/// a member starts typing in the add-item sheet.
///
/// A row is upserted every time an item is added:
///   - [timesAdded] is incremented.
///   - [lastUsedAt] is updated to now().
@DataClassName('ItemHistoryEntry')
class ItemHistory extends Table {
  /// SERIAL primary key — auto-incremented by the database.
  IntColumn get id => integer().autoIncrement()();

  /// The list this history entry belongs to. FK → lists.id
  TextColumn get listId => text().references(Lists, #id)();

  /// Name of the item as entered by the user. Max 100 characters.
  TextColumn get itemName => text().withLength(max: 100)();

  /// Optional category associated with the item. FK → categories.id
  IntColumn get categoryId =>
      integer().nullable().references(Categories, #id)();

  /// How many times this item name has been added to this list.
  IntColumn get timesAdded => integer().withDefault(const Constant(1))();

  /// Timestamp of the most recent addition (UTC).
  DateTimeColumn get lastUsedAt => dateTime()();

  /// A given item name can only appear once per list.
  @override
  List<Set<Column>> get uniqueKeys => [
        {listId, itemName},
      ];
}

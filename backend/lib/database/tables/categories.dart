import 'package:drift/drift.dart';

/// Table: categories
///
/// Static lookup table pre-populated with default shopping categories.
/// Rows are inserted once at database initialisation via [categoriesSeed].
/// End-users cannot add or remove categories in the initial scope.
@DataClassName('Category')
class Categories extends Table {
  /// Auto-incremented integer primary key (SERIAL in PostgreSQL).
  IntColumn get id => integer().autoIncrement()();

  /// Human-readable category name. Max 50 characters.
  TextColumn get name => text().withLength(max: 50)();

  /// Representative emoji for the category (e.g. "🥦").
  TextColumn get emoji => text().withLength(max: 5)();

  /// Hex colour used in the UI (e.g. "#4CAF50"). Always 7 chars: #RRGGBB.
  TextColumn get colorHex => text().withLength(min: 7, max: 7)();
}

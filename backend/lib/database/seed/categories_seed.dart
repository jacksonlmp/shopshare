import 'package:backend/database/app_database.dart';
import 'package:drift/drift.dart';

/// Inserts the default categories into the database if the table is empty.
///
/// Call this once during database initialisation.
/// Safe to call multiple times — it is a no-op when rows already exist.
Future<void> seedCategories(AppDatabase db) async {
  final count = await db.categories.count().getSingle();
  if (count > 0) return;

  await db.batch((batch) {
    batch.insertAll(
      db.categories,
      _defaultCategories.map(
        (s) => CategoriesCompanion.insert(
          name: s.name,
          emoji: s.emoji,
          colorHex: s.colorHex,
        ),
      ),
    );
  });
}

// ---------------------------------------------------------------------------
// Seed data — 10 default shopping categories
// ---------------------------------------------------------------------------

class _SeedCategory {
  const _SeedCategory(this.name, this.emoji, this.colorHex);
  final String name;
  final String emoji;
  final String colorHex;
}

const _defaultCategories = <_SeedCategory>[
  _SeedCategory('Fruits & Vegetables', '🥦', '#4CAF50'),
  _SeedCategory('Dairy & Eggs',        '🥛', '#90CAF9'),
  _SeedCategory('Meat & Fish',         '🥩', '#EF9A9A'),
  _SeedCategory('Bakery',              '🍞', '#FFCC80'),
  _SeedCategory('Beverages',           '🥤', '#CE93D8'),
  _SeedCategory('Snacks',              '🍿', '#FFE082'),
  _SeedCategory('Frozen',              '🧊', '#B3E5FC'),
  _SeedCategory('Cleaning',            '🧹', '#80DEEA'),
  _SeedCategory('Personal Care',       '🧴', '#F48FB1'),
  _SeedCategory('Other',               '📦', '#BDBDBD'),
];

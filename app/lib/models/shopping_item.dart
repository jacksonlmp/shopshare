import 'package:shopshare/models/category.dart';

/// Lightweight reference to a user as embedded in item responses.
/// Contains only the fields returned by the API in [ShoppingItem.addedBy].
class UserRef {
  final String userId;
  final String displayName;
  final String avatarEmoji;

  const UserRef({
    required this.userId,
    required this.displayName,
    required this.avatarEmoji,
  });

  factory UserRef.fromJson(Map<String, dynamic> json) => UserRef(
    userId: json['user_id'] as String,
    displayName: json['display_name'] as String,
    avatarEmoji: json['avatar_emoji'] as String,
  );

  Map<String, dynamic> toJson() => {
    'user_id': userId,
    'display_name': displayName,
    'avatar_emoji': avatarEmoji,
  };

  UserRef copyWith({
    String? userId,
    String? displayName,
    String? avatarEmoji,
  }) => UserRef(
    userId: userId ?? this.userId,
    displayName: displayName ?? this.displayName,
    avatarEmoji: avatarEmoji ?? this.avatarEmoji,
  );
}

class ShoppingItem {
  final String id;
  final String listId;
  final String name;
  final double quantity;
  final String? unit;
  final String? note;
  final bool isChecked;
  final String? checkedBy;
  final DateTime? checkedAt;
  final int sortOrder;
  final DateTime createdAt;
  final UserRef addedBy;
  final Category? category;

  const ShoppingItem({
    required this.id,
    required this.listId,
    required this.name,
    required this.quantity,
    this.unit,
    this.note,
    required this.isChecked,
    this.checkedBy,
    this.checkedAt,
    required this.sortOrder,
    required this.createdAt,
    required this.addedBy,
    this.category,
  });

  factory ShoppingItem.fromJson(Map<String, dynamic> json) => ShoppingItem(
    id: json['id'] as String,
    listId: json['list_id'] as String,
    name: json['name'] as String,
    quantity: (json['quantity'] as num).toDouble(),
    unit: json['unit'] as String?,
    note: json['note'] as String?,
    isChecked: json['is_checked'] as bool,
    checkedBy: json['checked_by'] as String?,
    checkedAt: json['checked_at'] != null
        ? DateTime.parse(json['checked_at'] as String)
        : null,
    sortOrder: json['sort_order'] as int,
    createdAt: DateTime.parse(json['created_at'] as String),
    addedBy: UserRef.fromJson(json['added_by'] as Map<String, dynamic>),
    category: json['category'] != null
        ? Category.fromJson(json['category'] as Map<String, dynamic>)
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'list_id': listId,
    'name': name,
    'quantity': quantity,
    if (unit != null) 'unit': unit,
    if (note != null) 'note': note,
    'is_checked': isChecked,
    if (checkedBy != null) 'checked_by': checkedBy,
    if (checkedAt != null) 'checked_at': checkedAt!.toIso8601String(),
    'sort_order': sortOrder,
    'created_at': createdAt.toIso8601String(),
    'added_by': addedBy.toJson(),
    if (category != null) 'category': category!.toJson(),
  };

  ShoppingItem copyWith({
    String? id,
    String? listId,
    String? name,
    double? quantity,
    String? unit,
    String? note,
    bool? isChecked,
    String? checkedBy,
    DateTime? checkedAt,
    int? sortOrder,
    DateTime? createdAt,
    UserRef? addedBy,
    Category? category,
  }) => ShoppingItem(
    id: id ?? this.id,
    listId: listId ?? this.listId,
    name: name ?? this.name,
    quantity: quantity ?? this.quantity,
    unit: unit ?? this.unit,
    note: note ?? this.note,
    isChecked: isChecked ?? this.isChecked,
    checkedBy: checkedBy ?? this.checkedBy,
    checkedAt: checkedAt ?? this.checkedAt,
    sortOrder: sortOrder ?? this.sortOrder,
    createdAt: createdAt ?? this.createdAt,
    addedBy: addedBy ?? this.addedBy,
    category: category ?? this.category,
  );

  @override
  bool operator ==(Object other) => other is ShoppingItem && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

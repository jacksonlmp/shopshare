import 'package:shopshare/models/shopping_item.dart';

/// A list member as returned by GET /api/lists/:id.
class Member {
  final String userId;
  final String displayName;
  final String avatarEmoji;
  final String role;
  final DateTime joinedAt;

  const Member({
    required this.userId,
    required this.displayName,
    required this.avatarEmoji,
    required this.role,
    required this.joinedAt,
  });

  factory Member.fromJson(Map<String, dynamic> json) => Member(
    userId: json['user_id'] as String,
    displayName: json['display_name'] as String,
    avatarEmoji: json['avatar_emoji'] as String,
    role: json['role'] as String,
    joinedAt: DateTime.parse(json['joined_at'] as String),
  );

  Map<String, dynamic> toJson() => {
    'user_id': userId,
    'display_name': displayName,
    'avatar_emoji': avatarEmoji,
    'role': role,
    'joined_at': joinedAt.toIso8601String(),
  };

  Member copyWith({
    String? userId,
    String? displayName,
    String? avatarEmoji,
    String? role,
    DateTime? joinedAt,
  }) => Member(
    userId: userId ?? this.userId,
    displayName: displayName ?? this.displayName,
    avatarEmoji: avatarEmoji ?? this.avatarEmoji,
    role: role ?? this.role,
    joinedAt: joinedAt ?? this.joinedAt,
  );
}

class ShoppingList {
  final String id;
  final String name;
  final String shareCode;
  final String ownerId;
  final bool isArchived;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<Member> members;
  final List<ShoppingItem> items;

  const ShoppingList({
    required this.id,
    required this.name,
    required this.shareCode,
    required this.ownerId,
    required this.isArchived,
    required this.createdAt,
    required this.updatedAt,
    this.members = const [],
    this.items = const [],
  });

  factory ShoppingList.fromJson(Map<String, dynamic> json) => ShoppingList(
    id: json['id'] as String,
    name: json['name'] as String,
    shareCode: json['share_code'] as String,
    ownerId: json['owner_id'] as String,
    isArchived: json['is_archived'] as bool,
    createdAt: DateTime.parse(json['created_at'] as String),
    updatedAt: DateTime.parse(json['updated_at'] as String),
    members:
        (json['members'] as List<dynamic>?)
            ?.map((e) => Member.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
    items:
        (json['items'] as List<dynamic>?)
            ?.map((e) => ShoppingItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'share_code': shareCode,
    'owner_id': ownerId,
    'is_archived': isArchived,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
    'members': members.map((m) => m.toJson()).toList(),
    'items': items.map((i) => i.toJson()).toList(),
  };

  ShoppingList copyWith({
    String? id,
    String? name,
    String? shareCode,
    String? ownerId,
    bool? isArchived,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<Member>? members,
    List<ShoppingItem>? items,
  }) => ShoppingList(
    id: id ?? this.id,
    name: name ?? this.name,
    shareCode: shareCode ?? this.shareCode,
    ownerId: ownerId ?? this.ownerId,
    isArchived: isArchived ?? this.isArchived,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    members: members ?? this.members,
    items: items ?? this.items,
  );

  @override
  bool operator ==(Object other) => other is ShoppingList && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

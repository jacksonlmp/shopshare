class Category {
  final int id;
  final String name;
  final String emoji;
  final String colorHex;

  const Category({
    required this.id,
    required this.name,
    required this.emoji,
    required this.colorHex,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'] as int,
    name: json['name'] as String,
    emoji: json['emoji'] as String,
    colorHex: json['color_hex'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'emoji': emoji,
    'color_hex': colorHex,
  };

  Category copyWith({int? id, String? name, String? emoji, String? colorHex}) =>
      Category(
        id: id ?? this.id,
        name: name ?? this.name,
        emoji: emoji ?? this.emoji,
        colorHex: colorHex ?? this.colorHex,
      );

  @override
  bool operator ==(Object other) => other is Category && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

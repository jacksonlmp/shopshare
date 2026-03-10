class User {
  final String id;
  final String displayName;
  final String avatarEmoji;
  final String? deviceToken;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.displayName,
    required this.avatarEmoji,
    this.deviceToken,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as String,
    displayName: json['display_name'] as String,
    avatarEmoji: json['avatar_emoji'] as String,
    deviceToken: json['device_token'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'display_name': displayName,
    'avatar_emoji': avatarEmoji,
    if (deviceToken != null) 'device_token': deviceToken,
    'created_at': createdAt.toIso8601String(),
  };

  User copyWith({
    String? id,
    String? displayName,
    String? avatarEmoji,
    String? deviceToken,
    DateTime? createdAt,
  }) => User(
    id: id ?? this.id,
    displayName: displayName ?? this.displayName,
    avatarEmoji: avatarEmoji ?? this.avatarEmoji,
    deviceToken: deviceToken ?? this.deviceToken,
    createdAt: createdAt ?? this.createdAt,
  );

  @override
  bool operator ==(Object other) => other is User && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

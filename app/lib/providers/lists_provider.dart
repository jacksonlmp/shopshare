import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shopshare/models/shopping_list.dart';
import 'package:shopshare/providers/api_client_provider.dart';
import 'package:shopshare/providers/user_provider.dart';

final listsProvider =
    AsyncNotifierProvider<ListsNotifier, List<ShoppingList>>(
  ListsNotifier.new,
);

class ListsNotifier extends AsyncNotifier<List<ShoppingList>> {
  @override
  Future<List<ShoppingList>> build() async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return [];
    return _fetchLists(user.userId);
  }

  Future<List<ShoppingList>> _fetchLists(String userId) async {
    final api = ref.read(apiClientProvider);
    final Response<dynamic> response =
        await api.dio.get('/api/users/$userId/lists');
    final List<dynamic> data = response.data as List<dynamic>;
    return data
        .map((e) => ShoppingList.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Creates a new list and optimistically adds it to the local state.
  Future<void> createList(String name) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    try {
      final api = ref.read(apiClientProvider);
      final Response<dynamic> response = await api.dio.post(
        '/api/lists',
        data: {'name': name.trim(), 'owner_id': user.userId},
      );

      // The create endpoint returns only list metadata (no members/items yet).
      // Build a ShoppingList with the current user as the sole member.
      final Map<String, dynamic> body = response.data as Map<String, dynamic>;
      final ShoppingList created = ShoppingList.fromJson({
        ...body,
        'members': [
          {
            'user_id': user.userId,
            'display_name': user.displayName,
            'avatar_emoji': user.avatarEmoji,
            'role': 'owner',
            'joined_at': DateTime.now().toUtc().toIso8601String(),
          },
        ],
        'items': <dynamic>[],
      });

      final List<ShoppingList> current = state.asData?.value ?? [];
      state = AsyncData([created, ...current]);
    } on DioException catch (e) {
      log('createList error', error: e, name: 'ListsNotifier');
      rethrow;
    }
  }

  /// Joins an existing list via its [shareCode] and refreshes the list state.
  Future<ShoppingList> joinList(String shareCode) async {
    final user = ref.read(currentUserProvider);
    if (user == null) throw StateError('No current user.');

    final api = ref.read(apiClientProvider);

    // 1. Join — returns {list_id}.
    final Response<dynamic> joinResponse = await api.dio.post(
      '/api/lists/join',
      data: {'share_code': shareCode.trim().toUpperCase(), 'user_id': user.userId},
    );
    final String listId =
        (joinResponse.data as Map<String, dynamic>)['list_id'] as String;

    // 2. Fetch full list details.
    final Response<dynamic> getResponse =
        await api.dio.get('/api/lists/$listId');
    final ShoppingList joined =
        ShoppingList.fromJson(getResponse.data as Map<String, dynamic>);

    final List<ShoppingList> current = state.asData?.value ?? [];
    if (!current.any((l) => l.id == joined.id)) {
      state = AsyncData([joined, ...current]);
    }

    return joined;
  }

  Future<void> refresh() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchLists(user.userId));
  }
}

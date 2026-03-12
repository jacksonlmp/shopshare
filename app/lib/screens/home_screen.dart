import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shopshare/models/shopping_list.dart';
import 'package:shopshare/providers/lists_provider.dart';
import 'package:shopshare/providers/user_provider.dart';

// ─── Colour constants ────────────────────────────────────────────────────────

const _kBackground = Color(0xFF0F0F1A);
const _kSurface = Color(0xFF1A1A2E);
const _kCard = Color(0xFF1E1E30);
const _kCardBorder = Color(0xFF2A2A45);
const _kPurple = Color(0xFF7B6EF6);
const _kPurpleDim = Color(0xFF3D3580);
const _kTextPrimary = Colors.white;
const _kTextSecondary = Color(0xFF8888AA);
const _kChipBg = Color(0xFF252540);

// ─── HomeScreen ──────────────────────────────────────────────────────────────

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final listsAsync = ref.watch(listsProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: _kBackground,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _AppBar(
              displayName: user?.displayName ?? '',
              avatarEmoji: user?.avatarEmoji ?? '',
              onJoin: () => _showJoinSheet(context, ref),
              onCreateList: () => _showCreateSheet(context, ref),
            ),
            Expanded(
              child: listsAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: _kPurple),
                ),
                error: (e, _) => _ErrorView(
                  onRetry: () => ref.read(listsProvider.notifier).refresh(),
                ),
                data: (lists) {
                  final active =
                      lists.where((l) => !l.isArchived).toList();
                  final archived =
                      lists.where((l) => l.isArchived).toList();

                  if (active.isEmpty && archived.isEmpty) {
                    return _EmptyState(
                      onCreateList: () => _showCreateSheet(context, ref),
                    );
                  }

                  return _ListsView(
                    active: active,
                    archived: archived,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Modals ────────────────────────────────────────────────────────────────

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: _kSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _CreateListSheet(
        onConfirm: (name) async {
          try {
            await ref.read(listsProvider.notifier).createList(name);
            if (context.mounted) Navigator.of(context).pop();
          } on DioException catch (e) {
            log('createList sheet error', error: e);
            if (context.mounted) {
              _showSnack(context, 'Não foi possível criar a lista.');
            }
          }
        },
      ),
    );
  }

  void _showJoinSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: _kSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _JoinListSheet(
        onConfirm: (code) async {
          try {
            await ref.read(listsProvider.notifier).joinList(code);
            if (context.mounted) Navigator.of(context).pop();
          } on DioException catch (e) {
            final statusCode = e.response?.statusCode;
            final msg = statusCode == 404
                ? 'Lista não encontrada. Verifique o código.'
                : statusCode == 409
                    ? 'Você já é membro desta lista.'
                    : 'Não foi possível entrar na lista.';
            if (context.mounted) _showSnack(context, msg);
          }
        },
      ),
    );
  }

  static void _showSnack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: _kCard,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

// ─── AppBar ───────────────────────────────────────────────────────────────────

class _AppBar extends StatelessWidget {
  const _AppBar({
    required this.displayName,
    required this.avatarEmoji,
    required this.onJoin,
    required this.onCreateList,
  });

  final String displayName;
  final String avatarEmoji;
  final VoidCallback onJoin;
  final VoidCallback onCreateList;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Row(
          children: [
            // Logo icon
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: _kPurple,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.shopping_cart_rounded,
                color: Colors.white,
                size: 22,
              ),
            ),
            const SizedBox(width: 10),
            // Title + greeting
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  RichText(
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'Shop',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                          ),
                        ),
                        TextSpan(
                          text: 'Share',
                          style: TextStyle(
                            color: _kPurple,
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (displayName.isNotEmpty)
                    Text(
                      'Olá, $displayName! $avatarEmoji',
                      style: const TextStyle(
                        color: _kTextSecondary,
                        fontSize: 12,
                        fontFamily: 'NotoColorEmoji',
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Entrar button
            OutlinedButton.icon(
              onPressed: onJoin,
              style: OutlinedButton.styleFrom(
                foregroundColor: _kTextPrimary,
                side: const BorderSide(color: _kCardBorder),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              icon: const Icon(Icons.login_rounded, size: 16),
              label: const Text('Entrar', style: TextStyle(fontSize: 13)),
            ),
            const SizedBox(width: 8),
            // Nova Lista button
            ElevatedButton.icon(
              onPressed: onCreateList,
              style: ElevatedButton.styleFrom(
                backgroundColor: _kPurple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.add_rounded, size: 16),
              label: const Text('Nova Lista', style: TextStyle(fontSize: 13)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Lists View ───────────────────────────────────────────────────────────────

class _ListsView extends StatefulWidget {
  const _ListsView({required this.active, required this.archived});

  final List<ShoppingList> active;
  final List<ShoppingList> archived;

  @override
  State<_ListsView> createState() => _ListsViewState();
}

class _ListsViewState extends State<_ListsView> {
  bool _archivedExpanded = false;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: _kPurple,
      backgroundColor: _kCard,
      onRefresh: () async {
        // Expose via context extension when list navigates. For now triggers
        // through ProviderScope ancestor via Consumer.
        final container = ProviderScope.containerOf(context);
        await container.read(listsProvider.notifier).refresh();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          const Text(
            'Minhas Listas',
            style: TextStyle(
              color: _kTextPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ...widget.active.map((list) => _ListCard(list: list)),
          if (widget.archived.isNotEmpty) ...[
            const SizedBox(height: 8),
            _ArchivedToggle(
              count: widget.archived.length,
              expanded: _archivedExpanded,
              onTap: () =>
                  setState(() => _archivedExpanded = !_archivedExpanded),
            ),
            if (_archivedExpanded)
              ...widget.archived.map((list) => _ListCard(list: list)),
          ],
        ],
      ),
    );
  }
}

// ─── List Card ────────────────────────────────────────────────────────────────

class _ListCard extends StatelessWidget {
  const _ListCard({required this.list});

  final ShoppingList list;

  @override
  Widget build(BuildContext context) {
    final int total = list.items.length;
    final int checked = list.items.where((i) => i.isChecked).length;
    final double progress = total == 0 ? 0 : checked / total;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: _kCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _kCardBorder),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              // Navigate to list detail — will be implemented with go_router.
            },
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Row 1: name + member avatars
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          list.name,
                          style: const TextStyle(
                            color: _kTextPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _MemberAvatars(members: list.members),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Share code chip
                  _ShareCodeChip(code: list.shareCode),
                  const SizedBox(height: 12),
                  // Row 2: item count + checked count
                  Row(
                    children: [
                      const Icon(
                        Icons.shopping_cart_outlined,
                        size: 14,
                        color: _kTextSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$total ${total == 1 ? 'item' : 'itens'}',
                        style: const TextStyle(
                          color: _kTextSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        total == 0
                            ? 'Vazia'
                            : '$checked/$total completo',
                        style: TextStyle(
                          color: total > 0 && checked == total
                              ? _kPurple
                              : _kPurple.withAlpha(200),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: _kPurpleDim.withAlpha(80),
                      valueColor:
                          const AlwaysStoppedAnimation<Color>(_kPurple),
                      minHeight: 4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Member Avatars ───────────────────────────────────────────────────────────

class _MemberAvatars extends StatelessWidget {
  const _MemberAvatars({required this.members});

  final List<Member> members;

  static const int _maxVisible = 4;

  @override
  Widget build(BuildContext context) {
    final visible = members.take(_maxVisible).toList();
    final overflow = members.length - _maxVisible;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...visible.map(
          (m) => Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              m.avatarEmoji,
              style: const TextStyle(
                fontSize: 18,
                fontFamily: 'NotoColorEmoji',
              ),
            ),
          ),
        ),
        if (overflow > 0) ...[
          const SizedBox(width: 4),
          Text(
            '+$overflow',
            style: const TextStyle(
              color: _kTextSecondary,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }
}

// ─── Share Code Chip ──────────────────────────────────────────────────────────

class _ShareCodeChip extends StatelessWidget {
  const _ShareCodeChip({required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _kChipBg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        code,
        style: const TextStyle(
          color: _kTextSecondary,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

// ─── Archived Toggle ─────────────────────────────────────────────────────────

class _ArchivedToggle extends StatelessWidget {
  const _ArchivedToggle({
    required this.count,
    required this.expanded,
    required this.onTap,
  });

  final int count;
  final bool expanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            const Icon(
              Icons.inventory_2_outlined,
              size: 16,
              color: _kTextSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              'Listas Arquivadas ($count)',
              style: const TextStyle(
                color: _kTextSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              expanded ? Icons.expand_less : Icons.expand_more,
              size: 18,
              color: _kTextSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreateList});

  final VoidCallback onCreateList;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: _kPurpleDim.withAlpha(60),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.shopping_cart_outlined,
                size: 40,
                color: _kPurple,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Nenhuma lista ainda',
              style: TextStyle(
                color: _kTextPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Crie sua primeira lista de compras ou entre em uma com o código de compartilhamento.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _kTextSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onCreateList,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _kPurple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                icon: const Icon(Icons.add_rounded),
                label: const Text(
                  'Criar nova lista',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Error View ───────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_rounded, color: _kTextSecondary, size: 48),
          const SizedBox(height: 12),
          const Text(
            'Não foi possível carregar as listas.',
            style: TextStyle(color: _kTextSecondary),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onRetry,
            child: const Text('Tentar novamente',
                style: TextStyle(color: _kPurple)),
          ),
        ],
      ),
    );
  }
}

// ─── Create List Sheet ────────────────────────────────────────────────────────

class _CreateListSheet extends StatefulWidget {
  const _CreateListSheet({required this.onConfirm});

  final Future<void> Function(String name) onConfirm;

  @override
  State<_CreateListSheet> createState() => _CreateListSheetState();
}

class _CreateListSheetState extends State<_CreateListSheet> {
  final TextEditingController _controller = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final String name = _controller.text.trim();
    if (name.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      await widget.onConfirm(name);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _kCardBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Nova Lista',
            style: TextStyle(
              color: _kTextPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Escolha um nome para identificar sua lista.',
            style: TextStyle(color: _kTextSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _controller,
            autofocus: true,
            style: const TextStyle(color: _kTextPrimary),
            decoration: InputDecoration(
              hintText: 'Ex.: Compras da semana',
              hintStyle: const TextStyle(color: _kTextSecondary),
              filled: true,
              fillColor: _kChipBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _kCardBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _kCardBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _kPurple, width: 1.5),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isLoading ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: _kPurple,
              foregroundColor: Colors.white,
              disabledBackgroundColor: _kPurpleDim,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'Criar lista',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ─── Join List Sheet ──────────────────────────────────────────────────────────

class _JoinListSheet extends StatefulWidget {
  const _JoinListSheet({required this.onConfirm});

  final Future<void> Function(String code) onConfirm;

  @override
  State<_JoinListSheet> createState() => _JoinListSheetState();
}

class _JoinListSheetState extends State<_JoinListSheet> {
  final TextEditingController _controller = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final String code = _controller.text.trim().toUpperCase();
    if (code.length != 6) {
      setState(() => _error = 'O código deve ter 6 caracteres.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await widget.onConfirm(code);
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      setState(() {
        _error = statusCode == 404
            ? 'Lista não encontrada.'
            : statusCode == 409
                ? 'Você já é membro desta lista.'
                : 'Não foi possível entrar na lista.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _kCardBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Entrar em lista',
            style: TextStyle(
              color: _kTextPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Digite o código de 6 caracteres compartilhado pelo dono da lista.',
            style: TextStyle(color: _kTextSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _controller,
            autofocus: true,
            maxLength: 6,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(
              color: _kTextPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w700,
              letterSpacing: 6,
            ),
            decoration: InputDecoration(
              hintText: 'A3K9XZ',
              hintStyle: TextStyle(
                color: _kTextSecondary.withAlpha(120),
                fontSize: 22,
                letterSpacing: 6,
                fontWeight: FontWeight.w700,
              ),
              counterText: '',
              errorText: _error,
              filled: true,
              fillColor: _kChipBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _kCardBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _kCardBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _kPurple, width: 1.5),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.redAccent),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.redAccent),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isLoading ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: _kPurple,
              foregroundColor: Colors.white,
              disabledBackgroundColor: _kPurpleDim,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'Entrar na lista',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

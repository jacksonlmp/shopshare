import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:shopshare/services/api_client.dart';
import 'package:shopshare/services/local_storage_service.dart';

const List<String> _kAvatarEmojis = [
  '🧑',
  '👩',
  '👨',
  '🧒',
  '👧',
  '👦',
  '👴',
  '👵',
  '🧓',
  '🧑‍💻',
  '👩‍💻',
  '👨‍🍳',
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final TextEditingController _nameController = TextEditingController();
  String _selectedEmoji = _kAvatarEmojis.first;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final String name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorMessage = 'Digite seu nome para continuar.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final ApiClient apiClient = ApiClient.create(prefs);

      final Response<Map<String, dynamic>> response = await apiClient.dio.post(
        '/api/users',
        data: {'display_name': name, 'avatar_emoji': _selectedEmoji},
      );

      final Map<String, dynamic> body = response.data!;
      final String userId = body['id'] as String;

      final LocalStorageService storage = LocalStorageService(prefs);
      await storage.saveUser(
        userId: userId,
        displayName: name,
        avatarEmoji: _selectedEmoji,
      );

      widget.onComplete();
    } on DioException catch (e) {
      log('Onboarding API error', error: e, name: 'OnboardingScreen');
      setState(() {
        _errorMessage = 'Não foi possível criar o perfil. Tente novamente.';
      });
    } catch (e, stack) {
      log(
        'Onboarding unexpected error',
        error: e,
        stackTrace: stack,
        name: 'OnboardingScreen',
      );
      setState(() {
        _errorMessage = 'Algo deu errado. Tente novamente.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: const Color(0xFF1A1A2E),
        body: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _HeroImage(),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _NameField(
                      controller: _nameController,
                      errorMessage: _errorMessage,
                    ),
                    const SizedBox(height: 32),
                    _EmojiPicker(
                      selected: _selectedEmoji,
                      onSelect: (emoji) =>
                          setState(() => _selectedEmoji = emoji),
                    ),
                    const SizedBox(height: 36),
                    _ConfirmButton(isLoading: _isLoading, onPressed: _confirm),
                    const SizedBox(height: 16),
                    const Text(
                      'Ao entrar, todos os membros da lista verão seu apelido ao adicionar itens.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF8888AA), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _HeroImage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── App bar — solid dark background, separate from image ──────────
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              children: const [
                Icon(
                  Icons.shopping_cart_outlined,
                  color: Color(0xFF9B8EF8),
                  size: 22,
                ),
                SizedBox(width: 8),
                Text(
                  'Compras Compartilhadas',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── Hero image with margins, rounded corners and edge fades ──────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              // Image with rounded corners
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 220,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    image: DecorationImage(
                      image: AssetImage('assets/images/supermarket.jpg'),
                      fit: BoxFit.cover,
                      onError: _handleImageError,
                    ),
                    color: Color(0xFF16213E),
                  ),
                ),
              ),
              // Bottom fade — transparent → dark
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xFF1A1A2E)],
                      stops: [0.2, 1.0],
                    ),
                  ),
                ),
              ),
              // Left edge fade
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.center,
                      colors: [Color(0xFF1A1A2E), Colors.transparent],
                      stops: [0.0, 0.25],
                    ),
                  ),
                ),
              ),
              // Right edge fade
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.center,
                      colors: [Color(0xFF1A1A2E), Colors.transparent],
                      stops: [0.0, 0.25],
                    ),
                  ),
                ),
              ),
              // Title sits in the faded bottom area
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'Bem-vindo!',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Organize suas compras em família ou com amigos em tempo real.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFFBBBBCC), fontSize: 14),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// Dart requires this to be a static / top-level function.
void _handleImageError(Object error, StackTrace? stack) {}

class _NameField extends StatelessWidget {
  const _NameField({required this.controller, required this.errorMessage});

  final TextEditingController controller;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF4A4080), width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              CircleAvatar(
                radius: 16,
                backgroundColor: Color(0xFF3D3580),
                child: Icon(
                  Icons.person_outline,
                  color: Color(0xFF9B8EF8),
                  size: 18,
                ),
              ),
              SizedBox(width: 12),
              Text(
                'SEU APELIDO',
                style: TextStyle(
                  color: Color(0xFF9B8EF8),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Como quer ser chamado?',
            style: TextStyle(color: Color(0xFF8888AA), fontSize: 13),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: controller,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Digite seu nome',
              hintStyle: const TextStyle(color: Color(0xFF555577)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF2E2E50)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF2E2E50)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF9B8EF8)),
              ),
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
              errorText: errorMessage,
              errorStyle: const TextStyle(color: Color(0xFFFF6B6B)),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmojiPicker extends StatelessWidget {
  const _EmojiPicker({required this.selected, required this.onSelect});

  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Escolha seu avatar',
          style: TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 6,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _kAvatarEmojis.length,
          itemBuilder: (context, index) {
            final String emoji = _kAvatarEmojis[index];
            final bool isSelected = emoji == selected;

            return GestureDetector(
              onTap: () => onSelect(emoji),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF3D3580)
                      : const Color(0xFF16213E),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF9B8EF8)
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  emoji,
                  style: const TextStyle(
                    fontSize: 26,
                    fontFamily: 'NotoColorEmoji',
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _ConfirmButton extends StatelessWidget {
  const _ConfirmButton({required this.isLoading, required this.onPressed});

  final bool isLoading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF7B6EF6),
          disabledBackgroundColor: const Color(0xFF4A4580),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
            : const Text(
                'Continuar',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}

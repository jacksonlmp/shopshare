import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:shopshare/screens/onboarding_screen.dart';
import 'package:shopshare/services/local_storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final LocalStorageService storage = LocalStorageService(prefs);
  runApp(ShopShareApp(hasUser: storage.hasUser));
}

class ShopShareApp extends StatelessWidget {
  const ShopShareApp({super.key, required this.hasUser});

  final bool hasUser;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Compras Compartilhadas',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7B6EF6),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: _RootNavigator(hasUser: hasUser),
    );
  }
}

/// Manages the top-level screen state:
/// - [OnboardingScreen] when no user_id is stored
/// - Placeholder home screen after onboarding completes (to be replaced later)
class _RootNavigator extends StatefulWidget {
  const _RootNavigator({required this.hasUser});

  final bool hasUser;

  @override
  State<_RootNavigator> createState() => _RootNavigatorState();
}

class _RootNavigatorState extends State<_RootNavigator> {
  late bool _hasUser;

  @override
  void initState() {
    super.initState();
    _hasUser = widget.hasUser;
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasUser) {
      return OnboardingScreen(
        onComplete: () => setState(() => _hasUser = true),
      );
    }

    // Temporary placeholder — will be replaced with HomeScreen + go_router.
    return const Scaffold(
      backgroundColor: Color(0xFF1A1A2E),
      body: Center(
        child: Text(
          'Bem-vindo de volta! 🎉',
          style: TextStyle(color: Colors.white, fontSize: 20),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:shopshare/providers/api_client_provider.dart';
import 'package:shopshare/router.dart';
import 'package:shopshare/services/local_storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final bool hasUser = LocalStorageService(prefs).hasUser;
  runApp(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: ShopShareApp(initialHasUser: hasUser),
    ),
  );
}

class ShopShareApp extends StatefulWidget {
  const ShopShareApp({super.key, required this.initialHasUser});

  final bool initialHasUser;

  @override
  State<ShopShareApp> createState() => _ShopShareAppState();
}

class _ShopShareAppState extends State<ShopShareApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = buildRouter(initialHasUser: widget.initialHasUser);
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ShopShare',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7B6EF6),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}

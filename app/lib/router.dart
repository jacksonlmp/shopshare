import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import 'package:shopshare/screens/home_screen.dart';
import 'package:shopshare/screens/onboarding_screen.dart';

abstract final class AppRoutes {
  static const String onboarding = '/onboarding';
  static const String home = '/home';
}

GoRouter buildRouter({required bool initialHasUser}) {
  return GoRouter(
    initialLocation: initialHasUser ? AppRoutes.home : AppRoutes.onboarding,
    routes: [
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (BuildContext context, GoRouterState state) =>
            OnboardingScreen(
          onComplete: () => context.go(AppRoutes.home),
        ),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (BuildContext context, GoRouterState state) =>
            const HomeScreen(),
      ),
    ],
  );
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: RoadGuardianApp()));
}

class RoadGuardianApp extends StatelessWidget {
  const RoadGuardianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RoadGuardian',
      theme: AppTheme.light(),
      routes: AppRouter.routes,
      initialRoute: AppRouter.mapRoute,
    );
  }
}

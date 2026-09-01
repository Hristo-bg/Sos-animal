import 'package:flutter/widgets.dart';

import '../../screens/map_view.dart';
import '../../screens/report_screen.dart';

class AppRouter {
  static const mapRoute = '/';
  static const reportRoute = '/report';

  static final routes = <String, WidgetBuilder>{
    mapRoute: (_) => const MapView(),
    reportRoute: (_) => const ReportScreen(),
  };
}

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/location_service.dart';
import 'connectivity_service.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return const LocationService();
});

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  return const ConnectivityService();
});

final isOnlineProvider = StreamProvider<bool>((ref) {
  return ref.watch(connectivityServiceProvider).watchIsOnline();
});

final speedMpsProvider = StreamProvider<double>((ref) {
  return ref.watch(locationServiceProvider).speedMetersPerSecondStream();
});

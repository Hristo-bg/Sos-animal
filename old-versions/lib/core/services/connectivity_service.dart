import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  const ConnectivityService();

  Stream<bool> watchIsOnline() {
    return Connectivity().onConnectivityChanged.map((r) {
      return r != ConnectivityResult.none;
    });
  }
}

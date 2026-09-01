import 'dart:math' as math;

class GeoPointLite {
  final double lat;
  final double lng;

  const GeoPointLite(this.lat, this.lng);
}

class PathOptimizer {
  const PathOptimizer();

  /// Returns indices representing visiting order (starting at 0 by default).
  ///
  /// Designed for up to 5 points (brute-force permutations).
  List<int> optimize({
    required List<GeoPointLite> points,
    int startIndex = 0,
  }) {
    if (points.isEmpty) return const [];
    if (points.length == 1) return const [0];

    if (startIndex < 0 || startIndex >= points.length) {
      throw RangeError.range(startIndex, 0, points.length - 1, 'startIndex');
    }

    final indices = List<int>.generate(points.length, (i) => i);
    indices.remove(startIndex);

    double best = double.infinity;
    List<int> bestOrder = const [];

    for (final perm in _permutations(indices)) {
      final order = <int>[startIndex, ...perm];
      final dist = _pathDistance(points, order);
      if (dist < best) {
        best = dist;
        bestOrder = order;
      }
    }

    return bestOrder;
  }

  double _pathDistance(List<GeoPointLite> pts, List<int> order) {
    double sum = 0;
    for (var i = 1; i < order.length; i++) {
      sum += _haversineMeters(pts[order[i - 1]], pts[order[i]]);
    }
    return sum;
  }

  Iterable<List<int>> _permutations(List<int> items) sync* {
    if (items.length <= 1) {
      yield List<int>.from(items);
      return;
    }

    for (var i = 0; i < items.length; i++) {
      final head = items[i];
      final rest = <int>[...items]..removeAt(i);
      for (final tail in _permutations(rest)) {
        yield <int>[head, ...tail];
      }
    }
  }

  double _haversineMeters(GeoPointLite a, GeoPointLite b) {
    const r = 6371000.0;
    final dLat = _degToRad(b.lat - a.lat);
    final dLng = _degToRad(b.lng - a.lng);

    final lat1 = _degToRad(a.lat);
    final lat2 = _degToRad(b.lat);

    final sinDLat = math.sin(dLat / 2);
    final sinDLng = math.sin(dLng / 2);

    final h = sinDLat * sinDLat + math.cos(lat1) * math.cos(lat2) * sinDLng * sinDLng;
    final c = 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h));
    return r * c;
  }

  double _degToRad(double deg) => deg * (math.pi / 180.0);
}

enum IncidentStatus {
  unclaimed,
  claimed,
  handled,
  verified,
  archived,
}

enum IncidentSeverity {
  low,
  medium,
  high,
  emergency,
}

enum IncidentUrgency {
  dead,
  wounded,
  trapped,
}

enum SpeciesType {
  mammal,
  reptile,
  bird,
  pet,
  other,
}

class IncidentV2 {
  final String id;
  final GeoPoint coordinates;
  final DateTime timestamp;
  final DateTime? resolvedAt;
  final String reporterId;
  final String? handlerId;
  final IncidentStatus status;
  final IncidentSeverity severity;
  final IncidentUrgency urgency;
  final SpeciesType speciesType;
  final String? photoUrl;
  final String? photoPath;
  final String? localPath; // For offline only
  final String? handlingNotes;
  final double? bearing; // Telemetry: degrees
  final double? speedMps; // Telemetry: meters per second

  const IncidentV2({
    required this.id,
    required this.coordinates,
    required this.timestamp,
    this.resolvedAt,
    required this.reporterId,
    this.handlerId,
    required this.status,
    required this.severity,
    required this.urgency,
    required this.speciesType,
    this.photoUrl,
    this.photoPath,
    this.localPath,
    this.handlingNotes,
    this.bearing,
    this.speedMps,
  });

  IncidentV2 copyWith({
    String? id,
    GeoPoint? coordinates,
    DateTime? timestamp,
    DateTime? resolvedAt,
    String? reporterId,
    String? handlerId,
    IncidentStatus? status,
    IncidentSeverity? severity,
    IncidentUrgency? urgency,
    SpeciesType? speciesType,
    String? photoUrl,
    String? photoPath,
    String? localPath,
    String? handlingNotes,
    double? bearing,
    double? speedMps,
  }) {
    return IncidentV2(
      id: id ?? this.id,
      coordinates: coordinates ?? this.coordinates,
      timestamp: timestamp ?? this.timestamp,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      reporterId: reporterId ?? this.reporterId,
      handlerId: handlerId ?? this.handlerId,
      status: status ?? this.status,
      severity: severity ?? this.severity,
      urgency: urgency ?? this.urgency,
      speciesType: speciesType ?? this.speciesType,
      photoUrl: photoUrl ?? this.photoUrl,
      photoPath: photoPath ?? this.photoPath,
      localPath: localPath ?? this.localPath,
      handlingNotes: handlingNotes ?? this.handlingNotes,
      bearing: bearing ?? this.bearing,
      speedMps: speedMps ?? this.speedMps,
    );
  }

  Map<String, dynamic> toJson() {
    final json = {
      'coordinates': coordinates.toJson(),
      'timestamp': timestamp.toUtc().toIso8601String(),
      'reporterId': reporterId,
      'status': status.name,
      'severity': severity.name,
      'urgency': urgency.name,
      'speciesType': speciesType.name,
    };

    if (resolvedAt != null) json['resolvedAt'] = resolvedAt!.toUtc().toIso8601String();
    if (handlerId != null) json['handlerId'] = handlerId;
    if (photoUrl != null) json['photoUrl'] = photoUrl;
    if (photoPath != null) json['photoPath'] = photoPath;
    // localPath is never sent to Firestore
    if (handlingNotes != null) json['handlingNotes'] = handlingNotes;
    if (bearing != null) json['bearing'] = bearing;
    if (speedMps != null) json['speedMps'] = speedMps;

    return json;
  }

  static IncidentV2 fromJson(Map<String, dynamic> json, {String? id}) {
    return IncidentV2(
      id: id ?? (json['id'] as String?) ?? '',
      coordinates: GeoPoint.fromJson(json['coordinates'] as Map<String, dynamic>? ?? {}),
      timestamp: DateTime.tryParse((json['timestamp'] as String?) ?? '')?.toUtc() ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      resolvedAt: DateTime.tryParse((json['resolvedAt'] as String?) ?? '')?.toUtc(),
      reporterId: (json['reporterId'] as String?) ?? '',
      handlerId: json['handlerId'] as String?,
      status: IncidentStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => IncidentStatus.unclaimed,
      ),
      severity: IncidentSeverity.values.firstWhere(
        (e) => e.name == json['severity'],
        orElse: () => IncidentSeverity.medium,
      ),
      urgency: IncidentUrgency.values.firstWhere(
        (e) => e.name == json['urgency'],
        orElse: () => IncidentUrgency.dead,
      ),
      speciesType: SpeciesType.values.firstWhere(
        (e) => e.name == json['speciesType'],
        orElse: () => SpeciesType.other,
      ),
      photoUrl: json['photoUrl'] as String?,
      photoPath: json['photoPath'] as String?,
      handlingNotes: json['handlingNotes'] as String?,
      bearing: (json['bearing'] as num?)?.toDouble(),
      speedMps: (json['speedMps'] as num?)?.toDouble(),
    );
  }
}

class GeoPoint {
  final double latitude;
  final double longitude;

  const GeoPoint(this.latitude, this.longitude);

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  static GeoPoint fromJson(Map<String, dynamic> json) {
    return GeoPoint(
      (json['latitude'] as num?)?.toDouble() ?? 0.0,
      (json['longitude'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

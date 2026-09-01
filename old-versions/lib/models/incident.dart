enum IncidentStatus {
  deceased,
  wounded,
  handled,
}

enum SpeciesGroup {
  mammal,
  bird,
  reptile,
  amphibian,
  fish,
  invertebrate,
  unknown,
}

class Incident {
  final String id;
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final String? photoUrl;
  final IncidentStatus status;
  final SpeciesGroup speciesGroup;

  final String? createdByUid;
  final String? claimedByOrgId;
  final String? claimedByUid;
  final DateTime? claimedAt;

  const Incident({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.status,
    required this.speciesGroup,
    this.photoUrl,
    this.createdByUid,
    this.claimedByOrgId,
    this.claimedByUid,
    this.claimedAt,
  });

  Incident copyWith({
    String? id,
    double? latitude,
    double? longitude,
    DateTime? timestamp,
    String? photoUrl,
    IncidentStatus? status,
    SpeciesGroup? speciesGroup,
    String? createdByUid,
    String? claimedByOrgId,
    String? claimedByUid,
    DateTime? claimedAt,
  }) {
    return Incident(
      id: id ?? this.id,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      timestamp: timestamp ?? this.timestamp,
      photoUrl: photoUrl ?? this.photoUrl,
      status: status ?? this.status,
      speciesGroup: speciesGroup ?? this.speciesGroup,
      createdByUid: createdByUid ?? this.createdByUid,
      claimedByOrgId: claimedByOrgId ?? this.claimedByOrgId,
      claimedByUid: claimedByUid ?? this.claimedByUid,
      claimedAt: claimedAt ?? this.claimedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': timestamp.toUtc().toIso8601String(),
      'photoUrl': photoUrl,
      'status': status.name,
      'speciesGroup': speciesGroup.name,
      'createdByUid': createdByUid,
      'claimedByOrgId': claimedByOrgId,
      'claimedByUid': claimedByUid,
      'claimedAt': claimedAt?.toUtc().toIso8601String(),
    };
  }

  static Incident fromJson(Map<String, dynamic> json) {
    final statusRaw = (json['status'] as String?) ?? IncidentStatus.deceased.name;
    final speciesRaw = (json['speciesGroup'] as String?) ?? SpeciesGroup.unknown.name;

    return Incident(
      id: (json['id'] as String?) ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      timestamp: DateTime.tryParse((json['timestamp'] as String?) ?? '')?.toUtc() ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      photoUrl: json['photoUrl'] as String?,
      status: IncidentStatus.values.firstWhere(
        (e) => e.name == statusRaw,
        orElse: () => IncidentStatus.deceased,
      ),
      speciesGroup: SpeciesGroup.values.firstWhere(
        (e) => e.name == speciesRaw,
        orElse: () => SpeciesGroup.unknown,
      ),
      createdByUid: json['createdByUid'] as String?,
      claimedByOrgId: json['claimedByOrgId'] as String?,
      claimedByUid: json['claimedByUid'] as String?,
      claimedAt: DateTime.tryParse((json['claimedAt'] as String?) ?? '')?.toUtc(),
    );
  }
}

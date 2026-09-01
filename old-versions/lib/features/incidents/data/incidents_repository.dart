import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/incident.dart';

class IncidentsRepository {
  final FirebaseFirestore firestore;

  const IncidentsRepository({required this.firestore});

  Stream<List<Incident>> watchIncidents() {
    return firestore
        .collection('incidents')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) {
      return snap.docs.map((d) {
        final data = d.data();

        final gp = data['location'] as GeoPoint?;
        final statusRaw = (data['status'] as String?) ?? IncidentStatus.deceased.name;
        final speciesRaw = (data['speciesGroup'] as String?) ?? SpeciesGroup.unknown.name;

        final claim = data['claim'] as Map<String, dynamic>?;
        final claimedAtTs = claim == null ? null : claim['claimedAt'] as Timestamp?;

        return Incident(
          id: d.id,
          latitude: gp?.latitude ?? 0,
          longitude: gp?.longitude ?? 0,
          timestamp: (data['createdAt'] as Timestamp?)?.toDate().toUtc() ??
              DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
          photoUrl: data['photoUrl'] as String?,
          status: IncidentStatus.values.firstWhere(
            (e) => e.name == statusRaw,
            orElse: () => IncidentStatus.deceased,
          ),
          speciesGroup: SpeciesGroup.values.firstWhere(
            (e) => e.name == speciesRaw,
            orElse: () => SpeciesGroup.unknown,
          ),
          createdByUid: data['createdByUid'] as String?,
          claimedByOrgId: claim == null ? null : claim['claimedByOrgId'] as String?,
          claimedByUid: claim == null ? null : claim['claimedByUid'] as String?,
          claimedAt: claimedAtTs?.toDate().toUtc(),
        );
      }).toList();
    });
  }

  Future<void> claimIncident({
    required String incidentId,
    required String orgId,
    required String uid,
  }) async {
    await firestore.collection('incidents').doc(incidentId).update({
      'claim': {
        'claimedByOrgId': orgId,
        'claimedByUid': uid,
        'claimedAt': FieldValue.serverTimestamp(),
      },
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> markHandled({required String incidentId}) async {
    await firestore.collection('incidents').doc(incidentId).update({
      'status': IncidentStatus.handled.name,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}

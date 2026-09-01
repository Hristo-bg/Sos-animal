import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:isar/isar.dart';

import '../models/incident.dart';

class SyncService {
  final Isar isar;
  final FirebaseFirestore firestore;
  final FirebaseStorage storage;

  const SyncService({
    required this.isar,
    required this.firestore,
    required this.storage,
  });

  Future<void> syncPending() async {
    throw UnimplementedError();
  }

  Future<String> uploadIncidentPhoto({
    required String incidentId,
    required File photoFile,
  }) async {
    final ref = storage.ref('incidentPhotos/$incidentId/${photoFile.uri.pathSegments.last}');
    await ref.putFile(photoFile);
    return await ref.getDownloadURL();
  }

  Future<void> upsertIncidentToFirestore(Incident incident) async {
    await firestore.collection('incidents').doc(incident.id).set({
      'createdByUid': incident.createdByUid,
      'createdAt': Timestamp.fromDate(incident.timestamp.toUtc()),
      'updatedAt': FieldValue.serverTimestamp(),
      'location': GeoPoint(incident.latitude, incident.longitude),
      'status': incident.status.name,
      'speciesGroup': incident.speciesGroup.name,
      'photoUrl': incident.photoUrl,
      if (incident.claimedByOrgId != null || incident.claimedByUid != null || incident.claimedAt != null)
        'claim': {
          'claimedByOrgId': incident.claimedByOrgId,
          'claimedByUid': incident.claimedByUid,
          'claimedAt': incident.claimedAt == null ? null : Timestamp.fromDate(incident.claimedAt!.toUtc()),
        },
    }, SetOptions(merge: true));
  }
}

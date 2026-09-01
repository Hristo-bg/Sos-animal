import 'package:isar/isar.dart';

part 'isar_incident.g.dart';

enum OfflineSyncState {
  pending,
  uploadingPhoto,
  writingDoc,
  synced,
  failed,
}

@collection
class IsarIncident {
  Id id = Isar.autoIncrement;

  late String incidentId;

  late double latitude;
  late double longitude;

  late DateTime timestamp;

  String? localPhotoPath;
  String? photoUrl;

  late String status;
  late String speciesGroup;

  late String syncState;

  String? lastError;
}

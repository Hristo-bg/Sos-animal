import 'package:isar/isar.dart';

import 'isar_incident.dart';

class OfflineIncidentsRepository {
  final Isar isar;

  const OfflineIncidentsRepository({required this.isar});

  Future<void> addPending(IsarIncident incident) async {
    await isar.writeTxn(() async {
      await isar.isarIncidents.put(incident);
    });
  }

  Future<List<IsarIncident>> getPending() {
    return isar.isarIncidents.filter().syncStateEqualTo(OfflineSyncState.pending.name).findAll();
  }

  Future<void> updateSyncState({
    required Id id,
    required OfflineSyncState state,
    String? lastError,
  }) async {
    await isar.writeTxn(() async {
      final item = await isar.isarIncidents.get(id);
      if (item == null) return;
      item.syncState = state.name;
      item.lastError = lastError;
      await isar.isarIncidents.put(item);
    });
  }
}

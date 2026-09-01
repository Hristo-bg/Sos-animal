import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/firebase/firebase_providers.dart';
import '../../../models/incident.dart';
import '../data/incidents_repository.dart';

final incidentsRepositoryProvider = Provider<IncidentsRepository>((ref) {
  return IncidentsRepository(firestore: ref.watch(firestoreProvider));
});

final incidentsStreamProvider = StreamProvider<List<Incident>>((ref) {
  return ref.watch(incidentsRepositoryProvider).watchIncidents();
});

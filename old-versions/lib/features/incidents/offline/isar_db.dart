import 'package:isar/isar.dart';

import 'isar_incident.dart';

class IsarDb {
  final Isar isar;

  const IsarDb(this.isar);

  static Future<Isar> open({required String directory}) {
    return Isar.open(
      [IsarIncidentSchema],
      directory: directory,
    );
  }
}

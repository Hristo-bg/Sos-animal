import 'package:flutter/material.dart';

class DriverSafetyOverlay extends StatelessWidget {
  final bool isBlocked;
  final double speedMps;

  const DriverSafetyOverlay({
    super.key,
    required this.isBlocked,
    required this.speedMps,
  });

  @override
  Widget build(BuildContext context) {
    if (!isBlocked) return const SizedBox.shrink();

    final kmh = speedMps * 3.6;

    return Positioned.fill(
      child: ColoredBox(
        color: Colors.black.withValues(alpha: 0.85),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: DefaultTextStyle(
              style: const TextStyle(color: Colors.white),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Driver Safety',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Stop the vehicle before reporting.\nCurrent speed: ${kmh.toStringAsFixed(0)} km/h',
                    style: const TextStyle(fontSize: 18),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

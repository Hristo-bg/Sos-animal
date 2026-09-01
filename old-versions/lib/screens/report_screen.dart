import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  CameraController? _camera;
  XFile? _captured;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;

    final controller = CameraController(
      cameras.first,
      ResolutionPreset.high,
      enableAudio: false,
    );

    await controller.initialize();

    if (!mounted) return;
    setState(() => _camera = controller);
  }

  Future<void> _capture() async {
    final cam = _camera;
    if (cam == null || !cam.value.isInitialized) return;
    final file = await cam.takePicture();
    if (!mounted) return;
    setState(() => _captured = file);
  }

  @override
  Widget build(BuildContext context) {
    final cam = _camera;

    return Scaffold(
      appBar: AppBar(title: const Text('Capture Incident')),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _captured != null
                  ? Image.file(File(_captured!.path), fit: BoxFit.cover)
                  : (cam == null || !cam.value.isInitialized)
                      ? const Center(child: CircularProgressIndicator())
                      : CameraPreview(cam),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton(
                  onPressed: _capture,
                  child: Text(_captured == null ? 'Capture' : 'Retake'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _camera?.dispose();
    super.dispose();
  }
}

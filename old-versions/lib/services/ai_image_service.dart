// RoadGuardian AI Image Service
// Handles TensorFlow Lite model loading and image classification

import 'dart:io';
import 'dart:typed_data';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;

class AIImageSuggestion {
  final String label;
  final double confidence;

  const AIImageSuggestion({required this.label, required this.confidence});
}

class AIImageService {
  const AIImageService();

  Interpreter? _interpreter;
  List<String>? _labels;
  bool _isModelLoaded = false;

  /// Load the TensorFlow Lite model and labels
  Future<void> loadModel() async {
    try {
      // Load model from assets
      _interpreter = await Interpreter.fromAsset('assets/models/mobilenet_v2_1.0_224.tflite');
      
      // Load labels from assets
      final labelsData = await rootBundle.loadString('assets/models/labels.txt');
      _labels = labelsData.split('\n');
      
      _isModelLoaded = true;
      print('AI Model loaded successfully');
    } catch (e) {
      print('Error loading AI model: $e');
      _isModelLoaded = false;
    }
  }

  /// Classify image bytes and return top predictions
  Future<List<AIImageSuggestion>> classifyImageBytes(List<int> bytes) async {
    if (!_isModelLoaded || _interpreter == null || _labels == null) {
      throw Exception('Model not loaded. Call loadModel() first.');
    }

    try {
      // Convert bytes to image
      final image = img.decodeImage(Uint8List.fromList(bytes));
      if (image == null) {
        throw Exception('Failed to decode image');
      }

      // Preprocess image for MobileNetV2 (224x224, normalize to [0,1])
      final resizedImage = img.copyResize(image, width: 224, height: 224);
      
      // Convert to Float32 list and normalize
      final input = List.generate(224 * 224 * 3, (i) {
        final pixelIndex = i ~/ 3;
        final channel = i % 3;
        final pixel = resizedImage.getPixel(
          pixelIndex % 224,
          pixelIndex ~/ 224,
        );
        
        // Extract RGB channels and normalize to [0,1]
        switch (channel) {
          case 0: return pixel.r / 255.0; // Red
          case 1: return pixel.g / 255.0; // Green
          case 2: return pixel.b / 255.0; // Blue
          default: return 0.0;
        }
      });

      // Reshape input to [1, 224, 224, 3]
      final inputShape = [1, 224, 224, 3];
      final inputBuffer = input.reshape(inputShape);
      
      // Prepare output buffer
      final output = List<double>.filled(1001, 0); // MobileNetV2 has 1001 classes
      final outputShape = [1, 1001];
      final outputBuffer = output.reshape(outputShape);

      // Run inference
      _interpreter!.run(inputBuffer, outputBuffer);

      // Process results and get top predictions
      final predictions = _processOutput(outputBuffer);
      
      // Filter for animal-related predictions
      final animalPredictions = _filterAnimalPredictions(predictions);
      
      return animalPredictions.take(5).toList(); // Return top 5 animal predictions
    } catch (e) {
      print('Error classifying image: $e');
      throw Exception('Failed to classify image: $e');
    }
  }

  /// Process model output and create suggestions
  List<AIImageSuggestion> _processOutput(List<List<double>> output) {
    final scores = output[0];
    final suggestions = <AIImageSuggestion>[];
    
    for (int i = 0; i < scores.length && i < _labels!.length; i++) {
      final label = _labels![i].trim();
      final confidence = scores[i];
      
      if (confidence > 0.01) { // Only include predictions with >1% confidence
        suggestions.add(AIImageSuggestion(
          label: label,
          confidence: confidence,
        ));
      }
    }
    
    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence.compareTo(a.confidence));
    
    return suggestions;
  }

  /// Filter predictions to only include animals and wildlife
  List<AIImageSuggestion> _filterAnimalPredictions(List<AIImageSuggestion> predictions) {
    const animalKeywords = [
      'animal', 'bird', 'dog', 'cat', 'deer', 'fox', 'wolf', 'bear', 'rabbit',
      'squirrel', 'mouse', 'rat', 'horse', 'cow', 'sheep', 'goat', 'pig',
      'chicken', 'duck', 'goose', 'turkey', 'eagle', 'hawk', 'owl',
      'snake', 'lizard', 'turtle', 'frog', 'fish', 'whale', 'dolphin',
      'lion', 'tiger', 'leopard', 'cheetah', 'elephant', 'rhino',
      'hippo', 'giraffe', 'zebra', 'kangaroo', 'koala', 'panda',
      'monkey', 'ape', 'bat', 'otter', 'seal', 'walrus', 'penguin'
    ];
    
    return predictions.where((prediction) {
      final label = prediction.label.toLowerCase();
      return animalKeywords.any((keyword) => label.contains(keyword));
    }).toList();
  }

  /// Classify image from file path
  Future<List<AIImageSuggestion>> classifyImageFile(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    return classifyImageBytes(bytes);
  }

  /// Get the most likely animal species
  Future<AIImageSuggestion?> getTopAnimalPrediction(List<int> bytes) async {
    final predictions = await classifyImageBytes(bytes);
    return predictions.isNotEmpty ? predictions.first : null;
  }

  /// Check if model is loaded
  bool get isModelLoaded => _isModelLoaded;

  /// Dispose resources
  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _labels = null;
    _isModelLoaded = false;
  }
}

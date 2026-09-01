import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:3001/api';
  String? _token;

  // Set JWT token after login/register
  void setToken(String token) {
    _token = token;
  }

  // Clear token on logout
  void clearToken() {
    _token = null;
  }

  // Helper: add Authorization header if token exists
  Map<String, String> _getHeaders({bool requireAuth = false}) {
    final headers = {'Content-Type': 'application/json'};
    if (requireAuth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // Register
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    String? organizationName,
    String role = 'user',
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/register'),
      headers: _getHeaders(),
      body: jsonEncode({
        'email': email,
        'password': password,
        if (organizationName != null) 'organization_name': organizationName,
        'role': role,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      setToken(data['token']);
      return data;
    } else {
      throw Exception(data['error'] ?? 'Registration failed');
    }
  }

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: _getHeaders(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      setToken(data['token']);
      return data;
    } else {
      throw Exception(data['error'] ?? 'Login failed');
    }
  }

  // Get all incidents (public)
  Future<List<Map<String, dynamic>>> getIncidents() async {
    final res = await http.get(
      Uri.parse('$baseUrl/incidents'),
      headers: _getHeaders(),
    );
    if (res.statusCode == 200) {
      final List data = jsonDecode(res.body);
      return data.cast<Map<String, dynamic>>();
    } else {
      throw Exception('Failed to fetch incidents');
    }
  }

  // Create incident (auth required)
  Future<Map<String, dynamic>> createIncident({
    required double lat,
    required double lng,
    required String status,
    String? species,
    String? photoPath,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/incidents'),
      headers: _getHeaders(requireAuth: true),
      body: jsonEncode({
        'lat': lat,
        'lng': lng,
        'status': status,
        if (species != null) 'species': species,
        if (photoPath != null) 'photo_path': photoPath,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Failed to create incident');
    }
  }

  // Upload photo (multipart/form-data)
  Future<String> uploadPhoto(String filePath, String fileName) async {
    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/incidents'));
    request.headers.addAll(_getHeaders(requireAuth: true));
    request.files.add(await http.MultipartFile.fromPath('photo', filePath, filename: fileName));
    final streamedResponse = await request.send();
    final res = await http.Response.fromStream(streamedResponse);
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      // Backend returns incident record; extract photo_path
      return data['photo_path'] ?? '';
    } else {
      throw Exception(data['error'] ?? 'Photo upload failed');
    }
  }
}

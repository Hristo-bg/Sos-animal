// RoadGuardian Notification Service
// Handles FCM token registration and topic/zone subscription

import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  const NotificationService();

  /// Initialize Firebase Cloud Messaging
  Future<void> initialize() async {
    // Request permission for iOS
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('User granted provisional permission');
    } else {
      print('User declined or has not accepted permission');
    }

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background message clicks
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
  }

  /// Get the current FCM token
  Future<String?> getFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }

  /// Register FCM token with backend
  Future<void> registerToken(String userId, String token) async {
    // TODO: Implement backend API call to register token
    // POST /api/users/{userId}/fcm-token
    // Body: { token: token }
    print('Registering FCM token for user $userId: $token');
  }

  /// Subscribe to incidents in a geographic zone
  Future<void> subscribeToZone(String zoneId) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic('zone_$zoneId');
      print('Subscribed to zone: $zoneId');
    } catch (e) {
      print('Error subscribing to zone $zoneId: $e');
    }
  }

  /// Unsubscribe from a geographic zone
  Future<void> unsubscribeFromZone(String zoneId) async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic('zone_$zoneId');
      print('Unsubscribed from zone: $zoneId');
    } catch (e) {
      print('Error unsubscribing from zone $zoneId: $e');
    }
  }

  /// Subscribe to organization-specific updates
  Future<void> subscribeToOrganization(String orgId) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic('org_$orgId');
      print('Subscribed to organization: $orgId');
    } catch (e) {
      print('Error subscribing to organization $orgId: $e');
    }
  }

  /// Unsubscribe from organization updates
  Future<void> unsubscribeFromOrganization(String orgId) async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic('org_$orgId');
      print('Unsubscribed from organization: $orgId');
    } catch (e) {
      print('Error unsubscribing from organization $orgId: $e');
    }
  }

  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    print('Received foreground message: ${message.messageId}');
    
    // Show in-app notification or update UI
    if (message.notification != null) {
      print('Notification: ${message.notification!.title} - ${message.notification!.body}');
    }
    
    // Handle custom data
    if (message.data.isNotEmpty) {
      print('Message data: ${message.data}');
      _handleCustomData(message.data);
    }
  }

  /// Handle message opened from background
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('Message opened from background: ${message.messageId}');
    
    // Navigate to specific incident or screen based on message data
    if (message.data.isNotEmpty) {
      _handleCustomData(message.data);
    }
  }

  /// Process custom message data
  void _handleCustomData(Map<String, dynamic> data) {
    final type = data['type'];
    final incidentId = data['incidentId'];
    
    switch (type) {
      case 'new_incident':
        // Navigate to incident details
        print('New incident: $incidentId');
        break;
      case 'incident_claimed':
        // Update incident status in UI
        print('Incident claimed: $incidentId');
        break;
      case 'incident_resolved':
        // Remove from active incidents
        print('Incident resolved: $incidentId');
        break;
      default:
        print('Unknown message type: $type');
    }
  }

  /// Monitor token refresh
  Stream<String> get onTokenRefresh {
    return FirebaseMessaging.instance.onTokenRefresh;
  }
}

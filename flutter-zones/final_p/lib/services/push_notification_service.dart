import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../core/firebase/firebase_guard.dart';
import '../data/repositories/notification_repository.dart';
import '../features/notifications/models/push_message.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService instance = PushNotificationService._();

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final NotificationRepository _notificationRepository =
      NotificationRepository.instance;

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    if (!FirebaseGuard.ready) return;

    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const initSettings = InitializationSettings(android: androidInit);
      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onLocalNotificationTap,
      );

      await FirebaseMessaging.instance.requestPermission();

      FirebaseMessaging.onMessage.listen(_onForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_onNotificationOpened);

      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) {
        _handleNavigation(initial.data);
      }

      _initialized = true;
    } catch (e) {
      debugPrint('Push notifications unavailable: $e');
    }
  }

  void _onForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final data = message.data.map((k, v) => MapEntry(k, v.toString()));
    final isStationAlert =
        data['type'] == 'station_alert' || data['type'] == 'manager_broadcast';

    final pushMessage = PushMessage(
      title: notification.title ?? '',
      body: notification.body ?? '',
      data: data,
    );

    _notificationRepository.publishForeground(pushMessage);

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          isStationAlert ? 'zones_alerts' : 'zones_tournaments',
          isStationAlert ? 'تنبيهات الصالة' : 'بطولات زونز',
          channelDescription: isStationAlert
              ? 'تنبيهات المدير والصيانة'
              : 'إشعارات البطولات والفائزين',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: jsonEncode(data),
    );
  }

  void _onNotificationOpened(RemoteMessage message) {
    _handleNavigation(message.data);
  }

  void _onLocalNotificationTap(NotificationResponse response) {
    if (response.payload == null) return;
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _handleNavigation(data);
    } catch (_) {}
  }

  void _handleNavigation(Map<String, dynamic> data) {
    final target = _notificationRepository.navigationFromData(data);
    if (target != null) {
      _notificationRepository.publishNavigation(target);
    }
  }
}

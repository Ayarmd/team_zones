import 'dart:async';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';

import '../../core/firebase/firebase_guard.dart';
import '../../features/notifications/models/push_message.dart';
import 'device_token_repository.dart';

class NotificationRepository {
  NotificationRepository._();
  static final NotificationRepository instance = NotificationRepository._();

  final _foregroundController = StreamController<PushMessage>.broadcast();
  final _navigationController = StreamController<PushNavigationTarget>.broadcast();

  Stream<PushMessage> get foregroundMessages => _foregroundController.stream;
  Stream<PushNavigationTarget> get navigationTargets => _navigationController.stream;

  void publishForeground(PushMessage message) {
    if (!_foregroundController.isClosed) {
      _foregroundController.add(message);
    }
  }

  void publishNavigation(PushNavigationTarget target) {
    if (!_navigationController.isClosed) {
      _navigationController.add(target);
    }
  }

  Future<String?> fetchFcmToken() async {
    if (!FirebaseGuard.ready) return null;
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  Future<void> registerTokenWithLaravel() async {
    if (!FirebaseGuard.ready) return;

    try {
      final token = await fetchFcmToken();
      if (token == null || token.isEmpty) return;

      final platform = Platform.isIOS ? 'ios' : 'android';
      await DeviceTokenRepository.instance.registerToken(
        token: token,
        platform: platform,
      );
    } catch (_) {
      // Login still succeeds without push registration.
    }
  }

  PushNavigationTarget? navigationFromData(Map<String, dynamic> data) {
    final type = data['type']?.toString();
    if (type == 'tournament_winner') {
      final tournamentId = data['tournament_id']?.toString();
      if (tournamentId == null || tournamentId.isEmpty) return null;

      return PushNavigationTarget(
        tournamentId: tournamentId,
        tournamentTitle: data['tournament_title']?.toString() ?? 'البطولة',
      );
    }

  // Station alerts open notifications drawer — no deep link yet.
    if (type == 'station_alert' || type == 'manager_broadcast') return null;

    return null;
  }
}

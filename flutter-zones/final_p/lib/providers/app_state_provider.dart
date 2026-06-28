import 'dart:async';

import 'package:flutter/foundation.dart';

import 'package:flutter/material.dart' show Color, Icons;



import '../data/repositories/booking_repository.dart';
import '../data/repositories/customer_ban_repository.dart';
import '../models/customer_ban_status.dart';
import '../data/repositories/loyalty_repository.dart';
import '../models/booking.dart';
import '../models/loyalty_status.dart';
import '../utils/date_format_utils.dart';

import '../models/lounge_model.dart';

import '../models/notification_model.dart';
import '../models/reward_milestone.dart';



class AppStateProvider extends ChangeNotifier {

  String userName = 'أحمد محمد';

  String userPhone = '+218 91 234 5678';

  bool pushNotificationsEnabled = true;

  bool bookingRemindersEnabled = true;

  int bottomNavIndex = 0;

  LoyaltyStatus? loyaltyStatus;

  CustomerBanStatus customerBan = CustomerBanStatus.none;

  final Set<int> _processedLoyaltyNotificationIds = {};

  Uint8List? profileAvatarBytes;

  final List<String> redeemedCoupons = [];



  final Set<String> favoriteLoungeNames = {};

  final List<Booking> _currentBookings = [];

  final List<Booking> _pastBookings = [];

  final List<AppNotification> _notifications = [];

  final Set<String> _notificationIds = {};



  AppNotification? _latestBannerNotification;



  List<Booking> get currentBookings => List.unmodifiable(_currentBookings);

  List<Booking> get pastBookings => List.unmodifiable(_pastBookings);

  /// Lounge device bookings only — tournaments live in participation records screens.
  List<Booking> get currentLoungeBookings => _currentBookings
      .where((b) => !b.isTournament)
      .toList(growable: false);

  List<Booking> get pastLoungeBookings =>
      _pastBookings.where((b) => !b.isTournament).toList(growable: false);

  List<Booking> get currentTournamentParticipations => _currentBookings
      .where((b) => b.isTournament && !b.isCancelled)
      .toList(growable: false);

  List<Booking> get pastTournamentParticipations =>
      _pastBookings.where((b) => b.isTournament).toList(growable: false);

  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  AppNotification? get latestBannerNotification => _latestBannerNotification;



  int get loyaltyPoints => loyaltyStatus?.pointsBalance ?? 0;

  int get nextMilestonePoints => loyaltyStatus?.minimumPointsRequired ?? 100;

  double get loyaltyProgress => loyaltyStatus?.progressValue ?? 0;

  bool get canPayWithPoints => loyaltyStatus?.canRedeemReward ?? false;

  bool get loyaltyRewardUnlocked => loyaltyStatus?.rewardUnlocked ?? false;

  bool get isCustomerBookingBanned => customerBan.isBanned;

  String? get customerBanMessage => customerBan.message;

  void applyLoyaltyStatus(LoyaltyStatus status) {
    loyaltyStatus = status;
    notifyListeners();
  }

  void applyCustomerBanStatus(CustomerBanStatus status) {
    customerBan = status;
    notifyListeners();
  }

  Future<void> syncBanStatusFromApi() async {
    try {
      final status = await CustomerBanRepository.instance.fetchStatus();
      applyCustomerBanStatus(status);
    } catch (_) {
      // Keep last known ban state when offline.
    }
  }

  void resetLoyaltyPointsAfterRedemption() {
    if (loyaltyStatus == null) return;
    final minimum = loyaltyStatus!.minimumPointsRequired;
    final remaining = loyaltyStatus!.pointsBalance - minimum;
    loyaltyStatus = LoyaltyStatus(
      pointsBalance: remaining < 0 ? 0 : remaining,
      minimumPointsRequired: loyaltyStatus!.minimumPointsRequired,
      pointsPerCompletedSession: loyaltyStatus!.pointsPerCompletedSession,
      estimatedSessionsRequired: loyaltyStatus!.estimatedSessionsRequired,
      sessionsRemaining: loyaltyStatus!.sessionsRemaining,
      progressPoints: (remaining < 0 ? 0 : remaining).clamp(0, minimum),
      progressMax: minimum,
      progressPercent: minimum > 0
          ? (((remaining < 0 ? 0 : remaining) / minimum) * 100).round().clamp(0, 100)
          : 0,
      canRedeemReward: remaining >= minimum,
      rewardUnlocked: remaining >= minimum,
    );
    notifyListeners();
  }



  Booking? getBookingById(String id) {

    for (final b in _currentBookings) {

      if (b.id == id) return b;

    }

    for (final b in _pastBookings) {

      if (b.id == id) return b;

    }

    return null;

  }



  void setBottomNavIndex(int index) {

    if (bottomNavIndex == index) return;

    bottomNavIndex = index;

    notifyListeners();

  }



  void updateProfile({required String name, required String phone}) {

    userName = name;

    userPhone = phone;

    notifyListeners();

  }



  void setPushNotifications(bool enabled) {

    pushNotificationsEnabled = enabled;

    notifyListeners();

  }



  void setBookingReminders(bool enabled) {

    bookingRemindersEnabled = enabled;

    notifyListeners();

  }



  void toggleFavorite(String loungeName) {

    if (favoriteLoungeNames.contains(loungeName)) {

      favoriteLoungeNames.remove(loungeName);

    } else {

      favoriteLoungeNames.add(loungeName);

    }

    notifyListeners();

  }



  bool isFavorite(String loungeName) =>

      favoriteLoungeNames.contains(loungeName);



  bool hasNotification(String id) => _notificationIds.contains(id);



  void pushNotification(AppNotification notification) {

    if (!pushNotificationsEnabled) return;

    if (_notificationIds.contains(notification.id)) return;



    _notificationIds.add(notification.id);

    _notifications.insert(0, notification);

    _latestBannerNotification = notification;

    notifyListeners();

  }



  void dismissBannerNotification() {

    _latestBannerNotification = null;

    notifyListeners();

  }



  void markNotificationRead(String id) {

    final index = _notifications.indexWhere((n) => n.id == id);

    if (index == -1) return;

    _notifications[index] = _notifications[index].markRead();

    notifyListeners();

  }

  void deleteNotification(String id) {
    _notifications.removeWhere((n) => n.id == id);
    _notificationIds.remove(id);
    if (_latestBannerNotification?.id == id) {
      _latestBannerNotification = null;
    }
    notifyListeners();
  }

  void deleteAllNotifications() {
    _notifications.clear();
    _notificationIds.clear();
    _latestBannerNotification = null;
    notifyListeners();
  }

  void setProfileAvatar(Uint8List bytes) {
    profileAvatarBytes = bytes;
    notifyListeners();
  }



  void addBooking({

    required String id,

    required String title,

    required String day,

    required String time,

    required double price,

    String? loungeName,

    String? deviceName,

    DeviceType? deviceType,

    PaymentStatus paymentStatus = PaymentStatus.paid,

    DateTime? startDateTime,

    int? earnedPoints,

    int? serverId,

    String? receiptPdfUrl,

  }) {

    _currentBookings.insert(

      0,

      Booking(

        id: id,

        title: title,

        day: day,

        time: time,

        price: price,

        status: BookingStatus.active,

        loungeName: loungeName,

        deviceName: deviceName,

        deviceType: deviceType,

        paymentStatus: paymentStatus,

        startDateTime: startDateTime,

        earnedPoints: earnedPoints,

        serverId: serverId,

        receiptPdfUrl: receiptPdfUrl,

      ),

    );



    notifyListeners();

  }

  void addTournamentBooking({
    required String id,
    required String tournamentTitle,
    required String day,
    required String time,
    required double entryFee,
    required String loungeName,
    required String loungeId,
    required String tournamentId,
    required String gameName,
    required PaymentStatus paymentStatus,
    required DateTime startDateTime,
  }) {
    _currentBookings.insert(
      0,
      Booking(
        id: id,
        title: tournamentTitle,
        day: day,
        time: time,
        price: entryFee,
        status: BookingStatus.active,
        loungeName: loungeName,
        paymentStatus: paymentStatus,
        startDateTime: startDateTime,
        type: BookingType.tournament,
        tournamentId: tournamentId,
        loungeId: loungeId,
        gameName: gameName,
      ),
    );
    notifyListeners();
  }

  void moveTournamentBookingToPast(String bookingId) {
    final index = _currentBookings.indexWhere((b) => b.id == bookingId);
    if (index == -1) return;

    final booking = _currentBookings.removeAt(index).copyWith(
          status: BookingStatus.past,
        );
    _pastBookings.insert(0, booking);
    notifyListeners();
  }

  void cancelTournamentBooking(String bookingId) {
    final index = _currentBookings.indexWhere((b) => b.id == bookingId);
    if (index == -1) return;

    final booking = _currentBookings.removeAt(index).copyWith(
          status: BookingStatus.cancelled,
        );
    _pastBookings.insert(0, booking);
    notifyListeners();
  }

  Future<void> syncLoyaltyFromApi() async {
    try {
      final result = await LoyaltyRepository.instance.fetchStatus();
      applyLoyaltyStatus(result.loyalty);

      for (final notification in result.notifications) {
        if (_processedLoyaltyNotificationIds.contains(notification.id)) {
          continue;
        }
        _processedLoyaltyNotificationIds.add(notification.id);

        final isMaintenanceCancel =
            notification.type == 'booking_cancelled_maintenance';
        final isStationAlert = notification.type == 'station_alert' ||
            notification.type == 'manager_broadcast';
        final cancelledBookingId = notification.payload?['booking_number']?.toString();

        pushNotification(
          AppNotification(
            id: isMaintenanceCancel
                ? 'booking-cancel-${notification.id}'
                : isStationAlert
                    ? 'station-alert-${notification.id}'
                    : 'loyalty-${notification.id}',
            title: notification.title,
            body: notification.body,
            createdAt: notification.createdAt ?? DateTime.now(),
            icon: isMaintenanceCancel
                ? Icons.build_circle_outlined
                : isStationAlert
                    ? Icons.campaign_outlined
                    : Icons.card_giftcard,
            color: isMaintenanceCancel
                ? const Color(0xFFD97706)
                : isStationAlert
                    ? const Color(0xFF6B5478)
                    : const Color(0xFF6B5478),
            type: isMaintenanceCancel
                ? NotificationType.bookingCancelled
                : isStationAlert
                    ? NotificationType.general
                    : NotificationType.reward,
            bookingId: isMaintenanceCancel ? cancelledBookingId : null,
          ),
        );

        if (isMaintenanceCancel) {
          unawaited(syncBookingsFromApi());
        }

        try {
          await LoyaltyRepository.instance.markNotificationRead(notification.id);
        } catch (_) {
          // Ignore read failures — notification already shown locally.
        }
      }
    } catch (_) {
      // Keep cached loyalty when offline or unauthenticated.
    }
  }

  Future<void> syncBookingsFromApi() async {
    try {
      await syncLoyaltyFromApi();
      final records = await BookingRepository.instance.fetchMyBookings();
      final now = DateTime.now();

      final loungeCurrent = <Booking>[];
      final loungePast = <Booking>[];

      for (final record in records) {
        final isCancelled = record.bookingStatus == 'cancelled' ||
            record.bookingStatus == 'cancelled_maintenance';

        final start = _parseBookingDateTime(record.date, record.hour);
        var end = _parseBookingDateTime(record.date, record.hourTo) ??
            start?.add(const Duration(hours: 1));
        if (start != null && end != null && !end.isAfter(start)) {
          end = end.add(const Duration(days: 1));
        }

        if (isCancelled) {
          final booking = Booking(
            id: record.bookingNumber,
            title: record.packageName,
            day: start != null ? formatArabicDate(start) : record.date,
            time: record.hour,
            price: record.totalPrice,
            status: BookingStatus.cancelled,
            loungeName: record.stationName,
            deviceName: record.deviceName,
            paymentStatus: record.paymentStatusEnum,
            startDateTime: start,
            earnedPoints: (record.totalPrice * 0.5).round(),
            loungeId: record.stationId.toString(),
            serverId: record.id,
            receiptPdfUrl: record.receiptPdfUrl,
          );
          loungePast.add(booking);
          continue;
        }

        final isPast = _isPastBooking(
          bookingStatus: record.bookingStatus,
          sessionStatus: record.sessionStatus,
          endDateTime: end,
          now: now,
        );

        final booking = Booking(
          id: record.bookingNumber,
          title: record.packageName,
          day: start != null ? formatArabicDate(start) : record.date,
          time: record.hour,
          price: record.totalPrice,
          status: isPast ? BookingStatus.past : BookingStatus.active,
          loungeName: record.stationName,
          deviceName: record.deviceName,
          paymentStatus: record.paymentStatusEnum,
          startDateTime: start,
          earnedPoints: (record.totalPrice * 0.5).round(),
          loungeId: record.stationId.toString(),
          serverId: record.id,
          receiptPdfUrl: record.receiptPdfUrl,
        );

        if (isPast) {
          loungePast.add(booking);
        } else {
          loungeCurrent.add(booking);
        }
      }

      _currentBookings.removeWhere((b) => b.isLounge && !b.isTournament);
      _pastBookings.removeWhere((b) => b.isLounge && !b.isTournament);
      _currentBookings.insertAll(0, loungeCurrent);
      _pastBookings.insertAll(0, loungePast);
      notifyListeners();
    } catch (_) {
      // Keep cached bookings when offline or unauthenticated.
    }
  }

  bool _isPastBooking({
    required String bookingStatus,
    required String? sessionStatus,
    required DateTime? endDateTime,
    required DateTime now,
  }) {
    if (bookingStatus == 'completed' || bookingStatus == 'expired') {
      return true;
    }
    if (bookingStatus == 'cancelled' || bookingStatus == 'cancelled_maintenance') {
      return true;
    }
    if (sessionStatus == 'finished' || sessionStatus == 'no_show') {
      return true;
    }
    // Active session lifecycle — keep in Current Reservations.
    if (sessionStatus == 'playing' || sessionStatus == 'checked_in') {
      return false;
    }
    if (endDateTime == null) return false;
    return !endDateTime.isAfter(now);
  }

  DateTime? _parseBookingDateTime(String date, String hour) {
    final dateParts = date.split('-');
    if (dateParts.length != 3) return null;
    final hourParts = hour.split(':');
    final h = int.tryParse(hourParts.first) ?? 0;
    final m = hourParts.length > 1 ? int.tryParse(hourParts[1]) ?? 0 : 0;

    return DateTime(
      int.parse(dateParts[0]),
      int.parse(dateParts[1]),
      int.parse(dateParts[2]),
      h,
      m,
    );
  }

  void cancelBooking(String bookingId) {

    final index = _currentBookings.indexWhere((b) => b.id == bookingId);

    if (index == -1) return;



    final booking = _currentBookings.removeAt(index).copyWith(

          status: BookingStatus.cancelled,

        );

    _pastBookings.insert(0, booking);

    notifyListeners();

  }

  /// Cancels a lounge booking on the server, then refreshes local state from API.
  Future<String?> cancelBookingViaApi(String bookingId) async {
    final index = _currentBookings.indexWhere((b) => b.id == bookingId);
    if (index == -1) {
      return 'الحجز غير موجود.';
    }

    final booking = _currentBookings[index];
    final serverId = booking.serverId;
    if (serverId == null) {
      return 'لا يمكن إلغاء هذا الحجز — معرّف الخادم غير متوفر.';
    }

    try {
      await BookingRepository.instance.cancelBooking(serverId);
      await syncBookingsFromApi();
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }



  Future<void> checkInBooking(String bookingId) async {
    final index = _currentBookings.indexWhere((b) => b.id == bookingId);
    if (index == -1) return;

    final booking = _currentBookings.removeAt(index).copyWith(
          status: BookingStatus.past,
          checkedIn: true,
        );
    _pastBookings.insert(0, booking);
    notifyListeners();

    await syncBookingsFromApi();

    pushNotification(
      AppNotification(
        id: 'checkin-$bookingId',
        title: 'تسجيل الحضور',
        body: 'تم تسجيل حضورك — النقاط تُحدَّث من السيرفر بعد إنهاء الجلسة.',
        createdAt: DateTime.now(),
        icon: Icons.qr_code_scanner,
        color: const Color(0xFF6B5478),
        type: NotificationType.general,
      ),
    );
  }

  String? redeemReward(RewardMilestone milestone) {

    if (!canPayWithPoints) return null;

    final code =

        '${milestone.couponPrefix}-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    redeemedCoupons.insert(0, code);

    notifyListeners();

    return code;

  }



  void deleteAccount() {

    userName = '';

    userPhone = '';

    loyaltyStatus = null;
    _processedLoyaltyNotificationIds.clear();

    redeemedCoupons.clear();

    favoriteLoungeNames.clear();

    _currentBookings.clear();

    _pastBookings.clear();

    _notifications.clear();

    _notificationIds.clear();

    _latestBannerNotification = null;

    bottomNavIndex = 0;

    notifyListeners();

  }

}



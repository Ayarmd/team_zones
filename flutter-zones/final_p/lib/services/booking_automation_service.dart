import 'dart:async';

import 'package:flutter/material.dart';

import '../models/booking.dart';
import '../models/notification_model.dart';
import '../providers/app_state_provider.dart';
import '../providers/tournament_provider.dart';

/// Automated reminders (2 hours before) and tournament lifecycle sync.
class BookingAutomationService {
  BookingAutomationService._();
  static final BookingAutomationService instance = BookingAutomationService._();

  Timer? _timer;
  AppStateProvider? _appState;
  TournamentProvider? _tournamentProvider;

  void start(
    AppStateProvider appState, {
    TournamentProvider? tournamentProvider,
  }) {
    _appState = appState;
    _tournamentProvider = tournamentProvider;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _runTasks());
    _runTasks();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _appState = null;
    _tournamentProvider = null;
  }

  void _runTasks() {
    final appState = _appState;
    if (appState == null) return;

    final now = DateTime.now();

    for (final booking in List<Booking>.from(appState.currentBookings)) {
      if (booking.startDateTime == null) continue;

      if (booking.isTournament) {
        _checkTournamentReminder(appState, booking, now);
        _syncTournamentPastStatus(appState, booking, now);
      } else {
        _checkLoungeReminder(appState, booking, now);
      }
    }
  }

  void _checkLoungeReminder(
    AppStateProvider appState,
    Booking booking,
    DateTime now,
  ) {
    if (!appState.bookingRemindersEnabled) return;

    final start = booking.startDateTime!;
    final reminderTime = start.subtract(const Duration(hours: 2));
    final diff = now.difference(reminderTime);

    if (diff.inSeconds >= 0 && diff.inMinutes < 2) {
      final notifId = 'reminder-2h-${booking.id}';
      if (appState.hasNotification(notifId)) return;

      appState.pushNotification(
        AppNotification(
          id: notifId,
          title: 'تنبيه الحجز',
          body:
              'تنبيه: متبقي ساعتان على موعد حجزك في ${booking.loungeName ?? "الصالة"}! جهّز نفسك 🎮',
          createdAt: now,
          icon: Icons.notifications_active_outlined,
          color: const Color(0xFF06B6D4),
          bookingId: booking.id,
          type: NotificationType.bookingReminder,
        ),
      );
    }
  }

  void _checkTournamentReminder(
    AppStateProvider appState,
    Booking booking,
    DateTime now,
  ) {
    if (!appState.bookingRemindersEnabled) return;
    if (booking.tournamentId == null) return;

    final start = booking.startDateTime!;
    final reminderTime = start.subtract(const Duration(hours: 2));
    final diff = now.difference(reminderTime);

    if (diff.inSeconds >= 0 && diff.inMinutes < 2) {
      final notifId = 'tournament-reminder-2h-${booking.id}';
      if (appState.hasNotification(notifId)) return;

      appState.pushNotification(
        AppNotification(
          id: notifId,
          title: 'تنبيه البطولة',
          body:
              'تنبيه: متبقي ساعتان على موعد مباراتك في ${booking.title}! جهّز نفسك 🎮',
          createdAt: now,
          icon: Icons.emoji_events,
          color: const Color(0xFFA020F0),
          bookingId: booking.id,
          tournamentId: booking.tournamentId,
          type: NotificationType.tournamentReminder,
        ),
      );
    }
  }

  void _syncTournamentPastStatus(
    AppStateProvider appState,
    Booking booking,
    DateTime now,
  ) {
    final tournamentProvider = _tournamentProvider;
    if (tournamentProvider == null || booking.tournamentId == null) return;

    final tournament = tournamentProvider.getTournament(booking.tournamentId!);
    if (tournament == null) return;

    final ended = tournament.isPast ||
        (tournament.endDate != null && now.isAfter(tournament.endDate!));

    if (ended) {
      appState.moveTournamentBookingToPast(booking.id);
    }
  }
}

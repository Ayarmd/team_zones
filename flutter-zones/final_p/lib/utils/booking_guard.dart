import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state_provider.dart';

/// Blocks new bookings when the customer is banned on the server.
class BookingGuard {
  BookingGuard._();

  static bool ensureCanBook(BuildContext context) {
    final appState = context.read<AppStateProvider>();
    if (!appState.isCustomerBookingBanned) return true;

    final message = appState.customerBanMessage ??
        'حسابك محظور مؤقتاً من الحجز عبر التطبيق.';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message, textAlign: TextAlign.center)),
    );
    return false;
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../models/zones_models.dart';
import '../../../providers/zones_data_provider.dart';
import '../../../utils/booking_guard.dart';
import '../../offers/offer_booking_wizard_screen.dart';

/// Opens the offer booking wizard when customer taps «احجز الآن».
class OfferBookingFlow {
  OfferBookingFlow._();

  static void show(
    BuildContext context, {
    required OfferModel offer,
    required String loungeName,
    required double finalPrice,
  }) {
    if (!BookingGuard.ensureCanBook(context)) return;

    if (!offer.isBookable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('هذا العرض غير جاهز للحجز حالياً')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OfferBookingWizardScreen(
          offer: offer,
          loungeName: loungeName.isNotEmpty ? loungeName : offer.stationName,
          finalPrice: finalPrice,
        ),
      ),
    );
  }

  static void showFromCarousel(
    BuildContext context,
    OfferModel offer,
    String loungeName,
  ) {
    final price = context.read<ZonesDataProvider>().getOfferPrice(offer.id);
    show(
      context,
      offer: offer,
      loungeName: loungeName,
      finalPrice: price,
    );
  }
}

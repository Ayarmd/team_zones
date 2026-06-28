import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/zonez_colors.dart';
import '../../../core/utils/media_url_resolver.dart';
import '../../../models/zones_models.dart';
import '../../../providers/app_state_provider.dart';
import 'offer_booking_flow.dart';

/// Dynamic offers block for the home page — API data only, no hardcoded cards.
class OffersSection extends StatelessWidget {
  const OffersSection({
    super.key,
    required this.isLoading,
    required this.offers,
    this.error,
    this.loungeName = '',
    this.onRetry,
  });

  final bool isLoading;
  final List<OfferModel> offers;
  final String? error;
  final String loungeName;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor =
        isDark ? ZonezColors.neonPurple : ZonezColors.lightPrimary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'العروض الحالية',
          style: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: titleColor,
          ),
        ),
        const SizedBox(height: 10),
        if (isLoading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 28),
            child: Center(
              child: CircularProgressIndicator(color: ZonezColors.neonPurple),
            ),
          )
        else if (error != null)
          _OffersMessageCard(
            icon: Icons.cloud_off_outlined,
            message: error!,
            actionLabel: 'إعادة المحاولة',
            onAction: onRetry,
          )
        else if (offers.isEmpty)
          const _OffersEmptyState()
        else
          OffersCarousel(
            offers: offers,
            loungeName: loungeName,
          ),
      ],
    );
  }
}

class OffersCarousel extends StatefulWidget {
  const OffersCarousel({
    super.key,
    required this.offers,
    this.loungeName = '',
  });

  final List<OfferModel> offers;
  final String loungeName;

  @override
  State<OffersCarousel> createState() => _OffersCarouselState();
}

class _OffersCarouselState extends State<OffersCarousel> {
  final PageController _pageController = PageController(viewportFraction: 0.92);
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  int? _discountFor(OfferModel offer) {
    if (offer.discountPercent != null && offer.discountPercent! > 0) {
      return offer.discountPercent;
    }
    final original = offer.originalPrice;
    final finalPrice = offer.discountedPrice;
    if (original == null ||
        finalPrice == null ||
        original <= 0 ||
        finalPrice >= original) {
      return null;
    }
    return ((1 - finalPrice / original) * 100).round();
  }

  String _formatPrice(double? value) {
    if (value == null) return '—';
    return '${value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 2)} د.ل';
  }

  String _formatExpiry(DateTime? date) {
    if (date == null) return '—';
    return DateFormat('dd/MM/yyyy').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final bookingBanned = context.watch<AppStateProvider>().isCustomerBookingBanned;

    return Column(
      children: [
        SizedBox(
          height: 260,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.offers.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (context, index) {
              final offer = widget.offers[index];
              final discount = _discountFor(offer);
              final stationLabel = offer.stationName.isNotEmpty
                  ? offer.stationName
                  : widget.loungeName;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: _OfferCard(
                  offer: offer,
                  stationName: stationLabel,
                  discountPercent: discount,
                  finalPriceLabel: _formatPrice(offer.discountedPrice),
                  expiryLabel: _formatExpiry(offer.expiresAt),
                  bookingBanned: bookingBanned,
                  onBookNow: () => OfferBookingFlow.showFromCarousel(
                    context,
                    offer,
                    stationLabel,
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.offers.length, (i) {
            final active = i == _currentPage;
            final isDark = Theme.of(context).brightness == Brightness.dark;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: active
                    ? (isDark ? ZonezColors.neonCyan : ZonezColors.lightPrimary)
                    : (isDark
                        ? Colors.white.withValues(alpha: 0.25)
                        : ZonezColors.lightPrimary.withValues(alpha: 0.25)),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _OffersEmptyState extends StatelessWidget {
  const _OffersEmptyState();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: ZonezColors.neonPurple.withValues(alpha: isDark ? 0.25 : 0.15),
        ),
        color: isDark
            ? ZonezColors.cardDark.withValues(alpha: 0.5)
            : ZonezColors.lightSurface,
      ),
      child: Column(
        children: [
          Icon(
            Icons.local_offer_outlined,
            size: 36,
            color: isDark ? ZonezColors.neonPurple : ZonezColors.lightPrimary,
          ),
          const SizedBox(height: 10),
          Text(
            'لا توجد عروض متاحة حالياً',
            style: GoogleFonts.cairo(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'ستظهر العروض الجديدة هنا فور إضافتها من لوحة المدير',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(
              fontSize: 12,
              color: ZonezColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _OffersMessageCard extends StatelessWidget {
  const _OffersMessageCard({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ZonezColors.neonRed.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: ZonezColors.neonRed),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(color: ZonezColors.neonRed, fontSize: 13),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 10),
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({
    required this.offer,
    required this.stationName,
    required this.finalPriceLabel,
    required this.expiryLabel,
    required this.onBookNow,
    this.discountPercent,
    this.bookingBanned = false,
  });

  final OfferModel offer;
  final String stationName;
  final String finalPriceLabel;
  final String expiryLabel;
  final VoidCallback onBookNow;
  final int? discountPercent;
  final bool bookingBanned;

  @override
  Widget build(BuildContext context) {
    final imageUrl = MediaUrlResolver.resolve(offer.offerImage)?.trim() ?? '';

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ZonezColors.neonPurple.withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(
            color: ZonezColors.neonPurple.withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl.isNotEmpty)
            Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _imageFallback(),
            )
          else
            _imageFallback(),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  ZonezColors.deepBlack.withValues(alpha: 0.92),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (discountPercent != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: ZonezColors.neonGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      'خصم $discountPercent%',
                      style: GoogleFonts.cairo(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                const Spacer(),
                if (stationName.isNotEmpty)
                  Text(
                    stationName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(
                      fontSize: 11,
                      color: ZonezColors.neonCyan,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                Text(
                  offer.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (offer.packageName.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    offer.packageName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(fontSize: 11, color: Colors.white70),
                  ),
                ],
                if (offer.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    offer.description.trim(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(fontSize: 10, color: Colors.white60),
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      finalPriceLabel,
                      style: GoogleFonts.cairo(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: ZonezColors.neonGold,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      'ينتهي $expiryLabel',
                      style: GoogleFonts.cairo(fontSize: 10, color: Colors.white60),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: bookingBanned
                      ? Opacity(
                          opacity: 0.55,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: ZonezColors.neonRed.withValues(alpha: 0.75),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              child: Text(
                                'حجز جديد',
                                style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        )
                      : GestureDetector(
                          onTap: onBookNow,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: ZonezColors.neonGradient,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              child: Text(
                                'احجز الآن',
                                style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _imageFallback() {
    return Container(
      color: ZonezColors.inputBg,
      child: const Icon(
        Icons.local_offer_outlined,
        color: ZonezColors.neonPurple,
        size: 48,
      ),
    );
  }
}

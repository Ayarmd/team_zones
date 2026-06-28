import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/zonez_colors.dart';
import '../../core/theme/zonez_typography.dart';
import '../../data/repositories/lounge_catalog_repository.dart';
import '../../models/booking_stop_status.dart';
import '../../models/lounge_model.dart';
import '../../providers/lounge_ratings_provider.dart';
import '../../providers/app_state_provider.dart';
import '../../widgets/circuit_background.dart';
import '../../widgets/zonez_screen.dart';
import '../../widgets/glass_container.dart';
import '../../widgets/neon_gradient_button.dart';
import '../../widgets/booking/booking_blocked_button.dart';
import '../../widgets/rating/device_rating_badges.dart';
import '../../widgets/rating/lounge_ratings_box.dart';
import '../../widgets/rating/lounge_comments_preview_box.dart';
import '../../widgets/rating/star_rating_row.dart';
import '../booking/lounge_booking_flow_screen.dart';

class LoungeDetailsScreen extends StatefulWidget {
  const LoungeDetailsScreen({
    super.key,
    required this.loungeId,
  });

  final String loungeId;

  @override
  State<LoungeDetailsScreen> createState() => _LoungeDetailsScreenState();
}

class _LoungeDetailsScreenState extends State<LoungeDetailsScreen> {
  Timer? _bookingStopTimer;
  BookingStopStatus? _liveBookingStop;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refresh();
      _startBookingStopPolling();
    });
  }

  @override
  void dispose() {
    _bookingStopTimer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    await context.read<LoungeRatingsProvider>().refreshLoungeDetails(widget.loungeId);
    await _pollBookingStop();
  }

  void _startBookingStopPolling() {
    _bookingStopTimer?.cancel();
    _bookingStopTimer = Timer.periodic(const Duration(seconds: 20), (_) => _pollBookingStop());
  }

  Future<void> _pollBookingStop() async {
    try {
      final stop = await LoungeCatalogRepository.instance.fetchBookingStopStatus(widget.loungeId);
      if (!mounted) return;
      setState(() => _liveBookingStop = stop);
    } catch (_) {
      /* ignore transient network errors */
    }
  }

  @override
  Widget build(BuildContext context) {
    final ratingsProvider = context.watch<LoungeRatingsProvider>();
    final lounge = ratingsProvider.loungeById(widget.loungeId);

    if (lounge == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('تفاصيل الصالة', style: ZonezTypography.title()),
        ),
        body: Center(
          child: Text(
            'الصالة غير متاحة',
            style: ZonezTypography.body(color: ZonezColors.textMuted),
          ),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(lounge.name, style: ZonezTypography.title(size: 17)),
        backgroundColor: Colors.transparent,
      ),
      body: Stack(
        children: [
          const CircuitBackground(),
          ZonezScreen(
            top: false,
            child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _HeroImage(lounge: lounge),
                const SizedBox(height: 16),
                _LoungeRatingHeader(lounge: lounge),
                if (lounge.services.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: lounge.services
                        .map(
                          (service) => Chip(
                            label: Text(
                              service,
                              style: ZonezTypography.caption(size: 11),
                            ),
                            backgroundColor:
                                ZonezColors.neonPurple.withValues(alpha: 0.15),
                            side: BorderSide(
                              color: ZonezColors.neonPurple.withValues(alpha: 0.35),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 12),
                DeviceRatingBadges(devices: lounge.availableDevices),
                const SizedBox(height: 20),
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        lounge.description,
                        style: ZonezTypography.body(size: 14),
                      ),
                      const SizedBox(height: 14),
                      _InfoChip(
                        icon: Icons.location_on_outlined,
                        label: lounge.location,
                      ),
                      if (lounge.workHoursLabel.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _InfoChip(
                          icon: Icons.schedule_outlined,
                          label: lounge.workHoursLabel,
                        ),
                      ],
                      const SizedBox(height: 8),
                      _InfoChip(
                        icon: Icons.sports_esports_outlined,
                        label: '${lounge.totalDevices} جهاز متاح',
                      ),
                      const SizedBox(height: 8),
                      _InfoChip(
                        icon: Icons.payments_outlined,
                        label: 'يبدأ من ${lounge.startingPrice} د.ل / ساعة',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                LoungeRatingsBox(lounge: lounge),
                const SizedBox(height: 24),
                LoungeCommentsPreviewBox(lounge: lounge),
                const SizedBox(height: 28),
                _BookingActionSection(
                  lounge: lounge,
                  bookingStop: _liveBookingStop ?? lounge.bookingStop,
                  bookingsBlocked: lounge.bookingsBlocked ||
                      _liveBookingStop != null ||
                      context.watch<AppStateProvider>().isCustomerBookingBanned,
                  banMessage: context.watch<AppStateProvider>().customerBanMessage,
                ),
              ],
            ),
          ),
          ),
        ],
      ),
    );
  }
}

class _BookingActionSection extends StatelessWidget {
  const _BookingActionSection({
    required this.lounge,
    required this.bookingStop,
    required this.bookingsBlocked,
    this.banMessage,
  });

  final LoungeModel lounge;
  final BookingStopStatus? bookingStop;
  final bool bookingsBlocked;
  final String? banMessage;

  @override
  Widget build(BuildContext context) {
    if (bookingsBlocked) {
      return BookingBlockedButton(
        label: banMessage != null ? 'حجز جديد' : (bookingStop?.buttonLabel ?? 'الحجز غير متاح مؤقتاً'),
        message: banMessage ?? bookingStop?.message,
      );
    }

    return NeonGradientButton(
      label: 'احجز الآن',
      icon: Icons.event_available,
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => LoungeBookingFlowScreen(lounge: lounge),
          ),
        );
      },
    );
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage({required this.lounge});

  final LoungeModel lounge;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 180,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              ZonezColors.neonPurple.withValues(alpha: 0.55),
              ZonezColors.neonCyan.withValues(alpha: 0.3),
            ],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (lounge.imageUrl != null && lounge.imageUrl!.isNotEmpty)
              Image.network(
                lounge.imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              )
            else
              Center(
                child: Icon(
                  Icons.sports_esports,
                  size: 64,
                  color: Colors.white.withValues(alpha: 0.25),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LoungeRatingHeader extends StatelessWidget {
  const _LoungeRatingHeader({required this.lounge});

  final LoungeModel lounge;

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(lounge.name, style: ZonezTypography.display(size: 20)),
                Text(
                  '${lounge.reviewCount} تقييم',
                  style: ZonezTypography.caption(),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              RatingStarsDisplay(rating: lounge.loungeAverageRating, size: 18),
              Text(
                'تقييم الصالة العامة',
                style: ZonezTypography.caption(size: 10),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: ZonezColors.neonCyan),
        const SizedBox(width: 8),
        Expanded(
          child: Text(label, style: ZonezTypography.body(size: 13)),
        ),
      ],
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/zonez_colors.dart';
import '../../../providers/branding_provider.dart';
import '../../../providers/app_state_provider.dart';
import '../../../providers/lounge_ratings_provider.dart';
import '../../../providers/zones_data_provider.dart';
import '../../../widgets/zonez_logo.dart';
import '../../../widgets/customer_ban_banner.dart';
import '../../lounge/lounge_details_screen.dart';
import '../widgets/zonez_lounge_card.dart';
import '../widgets/offers_carousel.dart';
import '../widgets/tournaments_carousel.dart';
import '../../../providers/tournament_provider.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({
    super.key,
    required this.onOpenDrawer,
    required this.onFavoriteTap,
  });

  final VoidCallback onOpenDrawer;
  final void Function(String loungeName) onFavoriteTap;

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ZonesDataProvider>().loadOffers(forceRefresh: true);
      context.read<LoungeRatingsProvider>().refreshLounges();
      context.read<TournamentProvider>().loadTournaments(forceRefresh: true);
    });
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      if (!mounted) return;
      context.read<TournamentProvider>().loadTournaments(forceRefresh: true);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _refreshHome() async {
    if (!mounted) return;
    await context.read<ZonesDataProvider>().loadOffers(forceRefresh: true);
    if (!mounted) return;
    context.read<LoungeRatingsProvider>().refreshLounges();
    if (!mounted) return;
    await context.read<TournamentProvider>().loadTournaments(forceRefresh: true);
  }

  void _openLoungeDetails(String loungeId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => LoungeDetailsScreen(loungeId: loungeId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final zonesData = context.watch<ZonesDataProvider>();
    final loungeProvider = context.watch<LoungeRatingsProvider>();
    final loungeList = loungeProvider.lounges;
    final hasLounges = loungeList.isNotEmpty;
    final defaultLounge = hasLounges ? loungeList.first.name : '';
    final onSurface = Theme.of(context).colorScheme.onSurface;
    final muted = Theme.of(context).brightness == Brightness.dark
        ? ZonezColors.textMuted
        : ZonezColors.lightTextMuted;

    return Column(
      children: [
        _buildHeader(widget.onOpenDrawer, onSurface, muted),
        Expanded(
          child: RefreshIndicator(
            color: ZonezColors.neonPurple,
            onRefresh: _refreshHome,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CustomerBanBanner(status: appState.customerBan),
                  OffersSection(
                    isLoading: zonesData.isLoadingOffers,
                    offers: zonesData.activeOffers,
                    error: zonesData.offersError,
                    loungeName: defaultLounge,
                    onRetry: () =>
                        zonesData.loadOffers(forceRefresh: true),
                  ),
                  const SizedBox(height: 16),
                  const TournamentsSection(),
                  const SizedBox(height: 16),
                  _buildSectionTitle(context),
                  const SizedBox(height: 10),
                  if (loungeProvider.isLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: CircularProgressIndicator(
                          color: ZonezColors.neonPurple,
                        ),
                      ),
                    )
                  else if (!hasLounges)
                    _buildLoungesEmptyState(loungeProvider)
                  else ...[
                    if (loungeProvider.error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          loungeProvider.error!,
                          style: GoogleFonts.cairo(
                            color: ZonezColors.neonGold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ...loungeList.map(
                      (l) => ZonezLoungeCard(
                        lounge: l,
                        isFavorite: appState.isFavorite(l.name),
                        onFavoriteTap: () => widget.onFavoriteTap(l.name),
                        onOpenDetails: () => _openLoungeDetails(l.id),
                      ),
                    ),
                  ],
                  const SizedBox(height: 72),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(VoidCallback onOpenDrawer, Color onSurface, Color muted) {
    final branding = context.watch<BrandingProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: onOpenDrawer,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? ZonezColors.neonPurple.withValues(alpha: 0.4)
                          : ZonezColors.lightPrimary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Icon(Icons.menu, color: onSurface),
                ),
              ),
              const SizedBox(width: 44),
            ],
          ),
          const SizedBox(height: 8),
          const ZonezLogo(size: 96, imageOnly: true, showText: false),
          const SizedBox(height: 6),
          Text(
            branding.platformName,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.orbitron(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: onSurface,
              letterSpacing: 8,
              shadows: [
                Shadow(
                  color: ZonezColors.neonCyan.withValues(alpha: 0.55),
                  blurRadius: 14,
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'اكتشف أفضل الصالات القريبة منك',
            style: GoogleFonts.cairo(fontSize: 13, color: muted),
          ),
        ],
      ),
    );
  }

  Widget _buildLoungesEmptyState(LoungeRatingsProvider loungeProvider) {
    final message = loungeProvider.error ??
        'لا توجد صالات منشورة حالياً.';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            message,
            style: GoogleFonts.cairo(color: ZonezColors.neonRed),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: loungeProvider.isLoading
                ? null
                : () => loungeProvider.refreshLounges(),
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: Text(
              'إعادة تحميل الصالات',
              style: GoogleFonts.cairo(fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: ZonezColors.neonCyan,
              side: BorderSide(
                color: ZonezColors.neonPurple.withValues(alpha: 0.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context) {
    return Row(
      children: [
        Icon(
          Icons.sports_esports,
          color: Theme.of(context).brightness == Brightness.dark
              ? ZonezColors.neonPurple
              : ZonezColors.lightPrimary,
          size: 20,
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            'صالات الألعاب',
            style: GoogleFonts.cairo(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}

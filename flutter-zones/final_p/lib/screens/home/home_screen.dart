import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/zonez_colors.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/tournament_provider.dart';
import '../../providers/zones_data_provider.dart';
import '../../services/booking_automation_service.dart';
import '../../services/booking_notification_service.dart';
import '../../services/live_booking_sync_service.dart';
import '../../widgets/circuit_background.dart';
import '../../widgets/notification_banner.dart';
import 'lounge_search_screen.dart';
import 'tabs/bookings_tab.dart';
import 'tabs/explore_tab.dart';
import 'tabs/favorites_tab.dart';
import 'tabs/home_tab.dart';
import 'widgets/zonez_drawer.dart';

/// Bottom navigation indices — search sits beside home inside the main shell.
abstract final class HomeNavIndex {
  static const home = 0;
  static const search = 1;
  static const explore = 2;
  static const favorites = 3;
  static const bookings = 4;
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = context.read<AppStateProvider>();
      context.read<ZonesDataProvider>().loadUserProfile();
      context.read<ZonesDataProvider>().loadOffers(forceRefresh: true);
      context.read<AppStateProvider>().syncBanStatusFromApi();
      BookingAutomationService.instance.start(
        appState,
        tournamentProvider: context.read<TournamentProvider>(),
      );
      LiveBookingSyncService.instance.start(appState);
      BookingNotificationService.instance.restoreRemindersForBookings(appState);
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      LiveBookingSyncService.instance.syncNow();
      context.read<ZonesDataProvider>().loadOffers(forceRefresh: true);
      context.read<AppStateProvider>().syncBanStatusFromApi();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    LiveBookingSyncService.instance.stop();
    BookingAutomationService.instance.stop();
    BookingNotificationService.instance.dispose();
    super.dispose();
  }

  void _onFavoriteTap(String loungeName) {
    final appState = context.read<AppStateProvider>();
    appState.toggleFavorite(loungeName);
    appState.setBottomNavIndex(HomeNavIndex.favorites);
  }

  int _shellIndex(int navIndex) {
    switch (navIndex) {
      case HomeNavIndex.home:
        return 0;
      case HomeNavIndex.search:
        return 1;
      case HomeNavIndex.favorites:
        return 2;
      case HomeNavIndex.bookings:
        return 3;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final navIndex = context.watch<AppStateProvider>().bottomNavIndex;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    context.read<ZonesDataProvider>().refreshOffersExpiry();

    final isExploreTab = navIndex == HomeNavIndex.explore;

    return Scaffold(
      key: _scaffoldKey,
      drawer: const ZonezDrawer(),
      body: isExploreTab
          ? ExploreTab(onFavoriteTap: _onFavoriteTap)
          : Stack(
              children: [
                const CircuitBackground(),
                SafeArea(
                  child: Column(
                    children: [
                      const NotificationBanner(),
                      Expanded(
                        child: IndexedStack(
                          index: _shellIndex(navIndex),
                          children: [
                            HomeTab(
                              onOpenDrawer: () =>
                                  _scaffoldKey.currentState?.openDrawer(),
                              onFavoriteTap: _onFavoriteTap,
                            ),
                            const LoungeSearchScreen(),
                            FavoritesTab(onFavoriteTap: _onFavoriteTap),
                            const BookingsTab(),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
      bottomNavigationBar: _buildBottomNav(navIndex, isDark),
    );
  }

  Widget _buildBottomNav(int navIndex, bool isDark) {
    final items = [
      (Icons.home, 'الرئيسية'),
      (Icons.search, 'بحث'),
      (Icons.explore_outlined, 'اكتشف'),
      (Icons.favorite_border, 'المفضلة'),
      (Icons.calendar_month_outlined, 'حجوزاتي'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? ZonezColors.cardDark.withValues(alpha: 0.95)
            : ZonezColors.lightSurface,
        border: Border(
          top: BorderSide(
            color: isDark
                ? ZonezColors.borderMuted.withValues(alpha: 0.5)
                : ZonezColors.lightBorder,
          ),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, -4),
                ),
              ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            textDirection: TextDirection.rtl,
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(
              items.length,
              (i) => _navItem(i, items[i], navIndex, isDark),
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(
    int index,
    (IconData, String) item,
    int navIndex,
    bool isDark,
  ) {
    final active = index == navIndex;

    return Expanded(
      child: GestureDetector(
        onTap: () => context.read<AppStateProvider>().setBottomNavIndex(index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: active
                  ? BoxDecoration(
                      gradient: isDark
                          ? ZonezColors.neonGradient
                          : ZonezColors.lightAccentGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: ZonezColors.neonPurple.withValues(alpha: 0.3),
                          blurRadius: 10,
                        ),
                      ],
                    )
                  : null,
              child: Icon(
                item.$1,
                color: active ? Colors.white : ZonezColors.textMuted,
                size: 22,
              ),
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                item.$2,
                style: GoogleFonts.cairo(
                  fontSize: 11,
                  color: active
                      ? (isDark
                          ? ZonezColors.neonCyan
                          : ZonezColors.lightPrimary)
                      : ZonezColors.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

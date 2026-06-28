import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/utils/media_url_resolver.dart';
import '../../../core/theme/zonez_colors.dart';
import '../../../models/tournament.dart';
import '../../../providers/tournament_provider.dart';
import '../../tournaments/tournament_home_details_screen.dart';

class TournamentsSection extends StatelessWidget {
  const TournamentsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TournamentProvider>();
    final tournaments = provider.allCurrentTournaments();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor = isDark ? ZonezColors.neonPurple : ZonezColors.lightPrimary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'البطولات',
          style: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: titleColor,
          ),
        ),
        const SizedBox(height: 10),
        if (provider.isLoading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 28),
            child: Center(
              child: CircularProgressIndicator(color: ZonezColors.neonPurple),
            ),
          )
        else if (provider.error != null)
          _MessageCard(
            icon: Icons.cloud_off_outlined,
            message: provider.error!,
            actionLabel: 'إعادة المحاولة',
            onAction: () => provider.loadTournaments(forceRefresh: true),
          )
        else if (tournaments.isEmpty)
          const _EmptyState()
        else
          TournamentsCarousel(tournaments: tournaments),
      ],
    );
  }
}

class TournamentsCarousel extends StatefulWidget {
  const TournamentsCarousel({super.key, required this.tournaments});

  final List<Tournament> tournaments;

  @override
  State<TournamentsCarousel> createState() => _TournamentsCarouselState();
}

class _TournamentsCarouselState extends State<TournamentsCarousel> {
  final PageController _pageController = PageController(viewportFraction: 0.92);
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 240,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.tournaments.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (context, index) {
              final tournament = widget.tournaments[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: TournamentCard(
                  tournament: tournament,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TournamentHomeDetailsScreen(
                          tournamentId: tournament.id,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.tournaments.length, (i) {
            final active = i == _currentPage;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active ? ZonezColors.neonCyan : ZonezColors.borderMuted,
                borderRadius: BorderRadius.circular(999),
              ),
            );
          }),
        ),
      ],
    );
  }
}

/// Home carousel summary card — image + tournament name, hall name, game type only.
class TournamentCard extends StatelessWidget {
  const TournamentCard({
    super.key,
    required this.tournament,
    required this.onTap,
  });

  final Tournament tournament;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hallName = tournament.loungeName.trim().isNotEmpty
        ? tournament.loungeName.trim()
        : '—';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: ZonezColors.neonPurple.withValues(alpha: 0.35),
              ),
              boxShadow: [
                BoxShadow(
                  color: ZonezColors.neonPurple.withValues(alpha: isDark ? 0.18 : 0.08),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Stack(
            fit: StackFit.expand,
            children: [
              if (tournament.coverImageUrl != null)
                Image.network(
                  MediaUrlResolver.resolve(tournament.coverImageUrl)!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => _fallbackBg(isDark),
                )
              else
                _fallbackBg(isDark),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.2),
                      Colors.black.withValues(alpha: 0.88),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Spacer(),
                    Text(
                      tournament.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _CardMetaRow(
                      icon: Icons.storefront_outlined,
                      label: hallName,
                    ),
                    const SizedBox(height: 6),
                    _CardMetaRow(
                      icon: Icons.sports_esports_outlined,
                      label: tournament.gameName,
                    ),
                    const SizedBox(height: 6),
                    _CardMetaRow(
                      icon: Icons.people_outline,
                      label: tournament.participantCapacityLabel,
                      labelColor: ZonezColors.neonCyan,
                    ),
                  ],
                ),
              ),
            ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _fallbackBg(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1A1424), const Color(0xFF0E1628)]
              : [ZonezColors.lightPrimary.withValues(alpha: 0.15), Colors.white],
        ),
      ),
      child: Center(
        child: Text(tournament.gameEmoji, style: const TextStyle(fontSize: 48)),
      ),
    );
  }
}

class _CardMetaRow extends StatelessWidget {
  const _CardMetaRow({
    required this.icon,
    required this.label,
    this.labelColor,
  });

  final IconData icon;
  final String label;
  final Color? labelColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: ZonezColors.neonCyan),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.cairo(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: labelColor ?? Colors.white.withValues(alpha: 0.92),
            ),
          ),
        ),
      ],
    );
  }
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({
    required this.icon,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ZonezColors.borderMuted),
      ),
      child: Column(
        children: [
          Icon(icon, color: ZonezColors.textMuted),
          const SizedBox(height: 8),
          Text(message, textAlign: TextAlign.center, style: GoogleFonts.cairo()),
          TextButton(onPressed: onAction, child: Text(actionLabel)),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ZonezColors.borderMuted),
      ),
      child: Text(
        'لا توجد بطولات متاحة حالياً',
        textAlign: TextAlign.center,
        style: GoogleFonts.cairo(color: ZonezColors.textMuted),
      ),
    );
  }
}

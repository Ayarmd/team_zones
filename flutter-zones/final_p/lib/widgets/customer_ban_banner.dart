import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme/zonez_colors.dart';
import '../core/theme/zonez_typography.dart';
import '../models/customer_ban_status.dart';

/// Prominent Arabic notice when the customer cannot create new bookings.
class CustomerBanBanner extends StatelessWidget {
  const CustomerBanBanner({super.key, required this.status});

  final CustomerBanStatus status;

  @override
  Widget build(BuildContext context) {
    if (!status.isBanned) return const SizedBox.shrink();

    final untilLabel = status.bannedUntil != null
        ? DateFormat('yyyy-MM-dd HH:mm').format(status.bannedUntil!.toLocal())
        : null;

    final text = status.message?.trim().isNotEmpty == true
        ? status.message!
        : untilLabel != null
            ? 'حسابك محظور من الحجز عبر التطبيق حتى $untilLabel بسبب تكرار عدم الحضور.'
            : 'حسابك محظور مؤقتاً من الحجز عبر التطبيق.';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ZonezColors.neonRed.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ZonezColors.neonRed.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.block, color: ZonezColors.neonRed, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'الحجز معطّل مؤقتاً',
                  style: ZonezTypography.title(
                    size: 14,
                    color: ZonezColors.neonRed,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  text,
                  style: ZonezTypography.caption(
                    size: 12,
                    color: ZonezColors.neonRed,
                    weight: FontWeight.w600,
                  ),
                ),
                if (status.noShowCount > 0) ...[
                  const SizedBox(height: 6),
                  Text(
                    'عدد مرات عدم الحضور: ${status.noShowCount}',
                    style: ZonezTypography.caption(
                      size: 11,
                      color: ZonezColors.textMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:open_filex/open_filex.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/theme/zonez_colors.dart';
import '../../models/booking.dart';
import '../../providers/app_state_provider.dart';
import '../../services/pdf_receipt_service.dart';
import '../../utils/booking_cancellation_utils.dart';
import '../../widgets/circuit_background.dart';
import '../../widgets/zonez_screen.dart';
import '../../widgets/neon_gradient_button.dart';

class BookingDetailScreen extends StatefulWidget {
  const BookingDetailScreen({super.key, required this.booking});

  final Booking booking;

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  bool _isSavingPdf = false;

  Future<void> _downloadPdf() async {
    setState(() => _isSavingPdf = true);
    try {
      final path = await PdfReceiptService.instance
          .generateAndSaveReceipt(widget.booking);
      if (!mounted) return;
      await OpenFilex.open(path);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'تم حفظ الإيصال',
            style: GoogleFonts.cairo(),
            textAlign: TextAlign.center,
          ),
          backgroundColor: ZonezColors.neonCyan,
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل حفظ الإيصال', style: GoogleFonts.cairo()),
            backgroundColor: ZonezColors.neonRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSavingPdf = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;
    final onSurface = Theme.of(context).colorScheme.onSurface;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final canCancel = booking.isActive && canCancelBooking(booking);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'تفاصيل الحجز',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
      ),
      body: Stack(
        children: [
          const CircuitBackground(),
          ZonezScreen(
            top: false,
            child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? ZonezColors.cardDark : ZonezColors.lightSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: ZonezColors.neonPurple.withValues(alpha: 0.2),
                    ),
                    boxShadow: isDark
                        ? null
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                  ),
                  child: Column(
                    children: [
                      _DetailRow('الصالة', booking.loungeName ?? booking.title, onSurface),
                      if (booking.deviceName != null)
                        _DetailRow('الجهاز', booking.deviceName!, onSurface),
                      _DetailRow('التاريخ', booking.day, onSurface),
                      _DetailRow('الوقت', booking.time, onSurface),
                      _DetailRow(
                        'السعر',
                        '${booking.price.toStringAsFixed(0)} د.ل',
                        onSurface,
                        valueColor: ZonezColors.neonCyan,
                      ),
                      _DetailRow(
                        'حالة الدفع',
                        booking.paymentStatusLabel,
                        onSurface,
                      ),
                    ],
                  ),
                ),
                if (booking.isActive) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: QrImageView(
                      data: booking.id,
                      version: QrVersions.auto,
                      size: 180,
                      backgroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اعرض هذا الرمز عند دخول الصالة',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.cairo(
                      fontSize: 13,
                      color: ZonezColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _isSavingPdf
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: ZonezColors.neonPurple,
                          ),
                        )
                      : NeonGradientButton(
                          label: 'حفظ الإيصال PDF',
                          icon: Icons.download_rounded,
                          onPressed: _downloadPdf,
                        ),
                  const SizedBox(height: 12),
                  NeonGradientButton(
                    label: 'محاكاة مسح QR (تسجيل الحضور)',
                    icon: Icons.qr_code_scanner,
                    onPressed: () async {
                      await context.read<AppStateProvider>().checkInBooking(booking.id);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'تم تسجيل الحضور — النقاط تُحدَّث من السيرفر.',
                              style: GoogleFonts.cairo(),
                              textAlign: TextAlign.center,
                            ),
                            backgroundColor: ZonezColors.neonCyan,
                          ),
                        );
                        Navigator.pop(context);
                      }
                    },
                  ),
                  if (!canCancel) ...[
                    const SizedBox(height: 12),
                    Text(
                      cancellationBlockedMessage(),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.cairo(
                        fontSize: 12,
                        color: ZonezColors.neonRed,
                      ),
                    ),
                  ],
                ],
              ],
            ),
          ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow(
    this.label,
    this.value,
    this.onSurface, {
    this.valueColor,
  });

  final String label;
  final String value;
  final Color onSurface;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.cairo(fontSize: 14, color: ZonezColors.textMuted),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.cairo(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: valueColor ?? onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

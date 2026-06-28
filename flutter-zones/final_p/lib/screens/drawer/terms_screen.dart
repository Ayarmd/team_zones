import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/zonez_colors.dart';
import '../../widgets/circuit_background.dart';
import '../../widgets/zonez_screen.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final onSurface = Theme.of(context).colorScheme.onSurface;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'شروط وقوانين الصالات',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
      ),
      body: Stack(
        children: [
          const CircuitBackground(),
          ZonezScreen(
            top: false,
            child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _SectionCard(
                title: 'سياسة الحجز والإلغاء',
                icon: Icons.event_available_outlined,
                iconColor: ZonezColors.neonCyan,
                onSurface: onSurface,
                rules: const [
                  'لا يستطيع المستخدم إلغاء الحجز قبل الموعد بأقل من 15 دقيقة.',
                  'بعد بدء الموعد: مهلة حضور 14 دقيقة ثم يُسجَّل الحجز كغياب (No-Show) تلقائياً من السيرفر.',
                  'عند تكرار الغياب 3 مرات يُحظر الحجز عبر التطبيق لمدة 3 أيام.',
                  'عند إلغاء الحجز، لا يتم استرجاع قيمة الموعد (لا يمكن استرداد الرسوم المدفوعة).',
                ],
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'سلامة الأجهزة',
                icon: Icons.devices_outlined,
                iconColor: ZonezColors.neonGold,
                onSurface: onSurface,
                rules: const [
                  'يُمنع إدخال المشروبات أو الطعام قرب الأجهزة.',
                  'يتحمل المستخدم مسؤولية أي ضرر ناتج عن سوء الاستخدام.',
                  'يُرجى الإبلاغ فوراً عن أي عطل في الجهاز قبل الاستخدام.',
                  'يُمنع تثبيت برامج أو تعديل إعدادات الأجهزة دون إذن.',
                ],
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'سلوك عام في الصالة',
                icon: Icons.groups_outlined,
                iconColor: ZonezColors.neonPurple,
                onSurface: onSurface,
                rules: const [
                  'يُرجى الحفاظ على الهدوء واحترام باقي اللاعبين.',
                  'يُمنع استخدام ألفاظ بذيئة أو سلوك عدواني.',
                  'يُمنع التدخين داخل الصالة بجميع أشكاله.',
                  'يحق للإدارة طرد أي مخالف دون استرداد المبلغ.',
                ],
              ),
            ],
          ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.onSurface,
    required this.rules,
  });

  final String title;
  final IconData icon;
  final Color iconColor;
  final Color onSurface;
  final List<String> rules;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? ZonezColors.cardDark
            : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: iconColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 24),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: onSurface,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...rules.map(
            (rule) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('• ', style: TextStyle(color: ZonezColors.neonCyan)),
                  Expanded(
                    child: Text(
                      rule,
                      style: GoogleFonts.cairo(
                        fontSize: 13,
                        color: ZonezColors.textMuted,
                        height: 1.5,
                      ),
                    ),
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

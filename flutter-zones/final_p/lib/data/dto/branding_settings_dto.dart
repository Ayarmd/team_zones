import '../../core/utils/media_url_resolver.dart';
import '../../core/branding/branding_constants.dart';

class BrandingSettings {
  const BrandingSettings({
    required this.platformName,
    this.logoUrl,
  });

  final String platformName;
  final String? logoUrl;

  bool get hasRemoteLogo => logoUrl != null && logoUrl!.trim().isNotEmpty;

  factory BrandingSettings.fallback() {
    return const BrandingSettings(
      platformName: BrandingConstants.defaultPlatformName,
      logoUrl: null,
    );
  }

  factory BrandingSettings.fromJson(Map<String, dynamic> json) {
    final rawLogo = json['logo_url'];
    final logo = rawLogo is String && rawLogo.trim().isNotEmpty
        ? MediaUrlResolver.resolve(rawLogo.trim())
        : null;

    return BrandingSettings(
      platformName: (json['platform_name'] as String?)?.trim().isNotEmpty == true
          ? (json['platform_name'] as String).trim()
          : BrandingConstants.defaultPlatformName,
      logoUrl: logo,
    );
  }
}

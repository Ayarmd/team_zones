import '../../core/utils/media_url_resolver.dart';
import '../../models/zones_models.dart';

/// REST-shaped offer row — mirrors GET /api/offers response.
class OfferCatalogDto {
  const OfferCatalogDto({
    required this.id,
    required this.title,
    required this.offerImage,
    required this.description,
    required this.validFrom,
    required this.expiresAt,
    required this.originalPrice,
    required this.discountedPrice,
    required this.discountPercent,
    required this.stationId,
    required this.packageId,
    required this.stationName,
    required this.packageName,
    required this.terms,
    required this.timeSlots,
  });

  final int id;
  final String title;
  final String offerImage;
  final String description;
  final DateTime validFrom;
  final DateTime expiresAt;
  final double originalPrice;
  final double discountedPrice;
  final int discountPercent;
  final int stationId;
  final int packageId;
  final String stationName;
  final String packageName;
  final List<String> terms;
  final List<OfferTimeSlotDto> timeSlots;

  factory OfferCatalogDto.fromJson(Map<String, dynamic> json) {
    return OfferCatalogDto(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      offerImage: json['offer_image'] as String? ?? '',
      description: json['description'] as String? ?? '',
      validFrom: DateTime.parse(json['valid_from'] as String),
      expiresAt: DateTime.parse(json['expires_at'] as String),
      originalPrice: (json['original_price'] as num?)?.toDouble() ?? 0,
      discountedPrice: (json['discounted_price'] as num?)?.toDouble() ?? 0,
      discountPercent: (json['discount_percent'] as num?)?.toInt() ?? 0,
      stationId: (json['station_id'] as num?)?.toInt() ?? 0,
      packageId: (json['package_id'] as num?)?.toInt() ?? 0,
      stationName: json['station_name']?.toString() ?? '',
      packageName: json['package_name']?.toString() ?? '',
      terms: (json['terms'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      timeSlots: (json['time_slots'] as List<dynamic>?)
              ?.map((e) => OfferTimeSlotDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  OfferModel toDomain() {
    return OfferModel(
      id: id,
      title: title,
      offerImage: MediaUrlResolver.resolve(offerImage) ?? offerImage,
      description: description,
      validFrom: validFrom,
      expiresAt: expiresAt,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      discountPercent: discountPercent,
      stationId: stationId > 0 ? stationId : null,
      packageId: packageId > 0 ? packageId : null,
      stationName: stationName,
      packageName: packageName,
      terms: terms,
    );
  }

  double get finalPrice => discountedPrice;
}

class OfferTimeSlotDto {
  const OfferTimeSlotDto({
    required this.id,
    required this.timeRange,
    required this.isAvailable,
  });

  final int id;
  final String timeRange;
  final bool isAvailable;

  factory OfferTimeSlotDto.fromJson(Map<String, dynamic> json) {
    return OfferTimeSlotDto(
      id: json['id'] as int,
      timeRange: json['time_range'] as String,
      isAvailable: json['is_available'] as bool? ?? true,
    );
  }

  TimeSlotModel toDomain() {
    return TimeSlotModel(
      id: id,
      timeRange: timeRange,
      isAvailable: isAvailable,
    );
  }
}

class OfferCatalogMapper {
  OfferCatalogMapper._();

  static OfferModel toOffer(OfferCatalogDto dto) => dto.toDomain();

  static List<TimeSlotModel> toTimeSlots(OfferCatalogDto dto) =>
      dto.timeSlots.map((s) => s.toDomain()).toList();
}

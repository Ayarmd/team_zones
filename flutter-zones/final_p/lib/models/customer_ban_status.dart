class CustomerBanStatus {
  const CustomerBanStatus({
    required this.isBanned,
    this.message,
    this.bannedUntil,
    this.noShowCount = 0,
  });

  final bool isBanned;
  final String? message;
  final DateTime? bannedUntil;
  final int noShowCount;

  factory CustomerBanStatus.fromJson(Map<String, dynamic> json) {
    final ban = json['ban'];
    DateTime? until;
    if (ban is Map && ban['banned_until'] != null) {
      until = DateTime.tryParse(ban['banned_until'].toString());
    }

    return CustomerBanStatus(
      isBanned: json['is_banned'] == true,
      message: json['message'] as String?,
      bannedUntil: until,
      noShowCount: (json['no_show_count'] as num?)?.toInt() ?? 0,
    );
  }

  static const none = CustomerBanStatus(isBanned: false);
}

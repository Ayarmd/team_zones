import '../../core/config/api_config.dart';
import '../../core/http/api_client.dart';
import '../../core/utils/media_url_resolver.dart';
import '../../models/tournament.dart';



/// Fetches tournaments from Laravel GET /api/tournaments.

class TournamentCatalogRepository {

  TournamentCatalogRepository._();

  static final TournamentCatalogRepository instance =

      TournamentCatalogRepository._();



  final ApiClient _api = ApiClient.instance;



  List<Tournament>? _cached;



  String _asString(dynamic value, {String fallback = ''}) {

    if (value == null) return fallback;

    return value.toString();

  }



  int? _asInt(dynamic value) {

    if (value == null) return null;

    if (value is int) return value;

    if (value is num) return value.toInt();

    return int.tryParse(value.toString());

  }



  double _asDouble(dynamic value, {double fallback = 0}) {

    if (value == null) return fallback;

    if (value is num) return value.toDouble();

    return double.tryParse(value.toString()) ?? fallback;

  }



  Future<List<Tournament>> fetchAll({bool forceRefresh = false}) async {

    if (!forceRefresh && _cached != null) return _cached!;



    final body = await _api.get('/tournaments');

    if (body is! List) {

      throw const ApiException(

        statusCode: 500,

        message: 'استجابة غير متوقعة من خادم البطولات',

      );

    }



    _cached = body

        .map((e) => _parseTournament(e as Map<String, dynamic>))

        .toList();



    return _cached!;

  }



  Future<List<Tournament>> fetchForLounge(

    String loungeId, {

    bool forceRefresh = false,

  }) async {

    final body = await _api.get(

      '/tournaments',

      query: {'lounge_id': loungeId},

    );



    if (body is! List) {

      throw const ApiException(

        statusCode: 500,

        message: 'استجابة غير متوقعة من خادم البطولات',

      );

    }



    return body

        .map((e) => _parseTournament(e as Map<String, dynamic>))

        .toList();

  }



  Future<Tournament?> fetchById(String id) async {

    try {

      final body = await _api.get('/tournaments/$id');

      if (body is! Map<String, dynamic>) return null;

      return _parseTournament(body);

    } on ApiException {

      return null;

    }

  }



  Future<TournamentRegisterResult> register({

    required String tournamentId,

    required String playerName,

  }) async {

    final body = await _api.post(

      '/tournaments/$tournamentId/register',

      body: {'player_name': playerName},

    );



    if (body is! Map<String, dynamic>) {

      throw const ApiException(

        statusCode: 500,

        message: 'استجابة غير متوقعة بعد تأكيد الاشتراك',

      );

    }



    invalidateCache();



    final tournamentJson = body['tournament'];

    if (tournamentJson is! Map<String, dynamic>) {

      throw const ApiException(

        statusCode: 500,

        message: 'تعذر قراءة بيانات البطولة بعد الاشتراك',

      );

    }



    final tournament = _parseTournament(tournamentJson);

    final participantJson = body['participant'];

    String participantId = '';

    String participantName = playerName;



    if (participantJson is Map<String, dynamic>) {

      participantId = _asString(participantJson['id']);

      participantName = _asString(participantJson['name'], fallback: playerName);

    } else if (tournament.participants.isNotEmpty) {

      final last = tournament.participants.last;

      participantId = last.id;

      participantName = last.name;

    }



    if (participantId.isEmpty) {

      throw const ApiException(

        statusCode: 500,

        message: 'تم الاشتراك لكن تعذر قراءة بيانات المشارك',

      );

    }



    return TournamentRegisterResult(

      tournament: tournament,

      participantId: participantId,

      participantName: participantName,

    );

  }



  Future<Tournament?> unregister({required String tournamentId}) async {

    final body = await _api.post(

      ApiConfig.tournamentUnregister(int.parse(tournamentId)),

    ) as Map<String, dynamic>;



    invalidateCache();



    final tournamentJson = body['tournament'];

    if (tournamentJson is Map<String, dynamic>) {

      return _parseTournament(tournamentJson);

    }



    return fetchById(tournamentId);

  }



  Future<List<Map<String, dynamic>>> fetchMyRegistrations() async {
    final body = await _api.get(ApiConfig.myTournamentRegistrations)
        as Map<String, dynamic>;
    return _parseRegistrationList(body);
  }

  Future<List<Map<String, dynamic>>> fetchMyActiveRegistrations() async {
    final body = await _api.get(ApiConfig.myActiveTournamentRegistrations)
        as Map<String, dynamic>;
    return _parseRegistrationList(body);
  }

  Future<List<Map<String, dynamic>>> fetchMyParticipationHistory() async {
    final body = await _api.get(ApiConfig.myTournamentParticipationHistory)
        as Map<String, dynamic>;
    return _parseRegistrationList(body);
  }

  Future<Tournament> fetchBracket(String tournamentId) async {
    final id = int.tryParse(tournamentId);
    if (id == null) {
      throw const ApiException(
        statusCode: 400,
        message: 'معرّف البطولة غير صالح',
      );
    }

    final body = await _api.get(ApiConfig.tournamentBracket(id))
        as Map<String, dynamic>;
    final tournamentJson = body['tournament'];
    if (tournamentJson is! Map<String, dynamic>) {
      throw const ApiException(
        statusCode: 500,
        message: 'تعذر قراءة شجرة البطولة',
      );
    }

    return _parseTournament(tournamentJson);
  }

  List<Map<String, dynamic>> _parseRegistrationList(Map<String, dynamic> body) {
    final list = body['registrations'] as List<dynamic>? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }



  Tournament _parseTournament(Map<String, dynamic> json) {

    final startRaw = json['start_date'];

    if (startRaw == null) {

      throw const ApiException(

        statusCode: 500,

        message: 'تاريخ بداية البطولة غير متوفر',

      );

    }



    return Tournament(

      id: _asString(json['id']),

      loungeId: _asString(json['lounge_id']),

      loungeName: _asString(json['lounge_name']),

      title: _asString(json['title']),

      gameName: _asString(json['game_name']),

      gameEmoji: _asString(json['game_emoji'], fallback: '🎮'),

      startDate: DateTime.parse(startRaw.toString()),

      endDate: json['end_date'] != null

          ? DateTime.tryParse(json['end_date'].toString())

          : null,

      registrationDeadline: json['registration_deadline'] != null

          ? DateTime.tryParse(json['registration_deadline'].toString())

          : null,

      coverImageUrl: MediaUrlResolver.resolve(json['cover_image_url'] as String?),

      prizeSummary: _asString(json['prize_summary']),

      entryFee: _asDouble(json['entry_fee']),

      matchRules: _asString(json['match_rules']),

      status: _parseStatus(_asString(json['status'], fallback: 'upcoming')),

      maxParticipants:

          _asInt(json['max_participants']) ?? Tournament.kMaxCapacity,

      participantsCount: _asInt(json['participants_count']),

      isFull: json['is_full'] == true,

      canJoin: json['can_join'] != false,

      isRegistrationOpen: json['is_registration_open'] != false,

      myRegistrationStatus: json['my_registration_status'] as String?,

      delayMinutes: _asInt(json['delay_minutes']) ?? 10,

      participants: _parseParticipants(json['participants'] as List<dynamic>? ?? []),

      matches: _parseMatches(json['matches'] as List<dynamic>? ?? []),

    );

  }



  List<TournamentParticipant> _parseParticipants(List<dynamic> raw) {

    return raw.map((item) {

      final json = item as Map<String, dynamic>;

      return TournamentParticipant(

        id: _asString(json['id']),

        name: _asString(json['name']),

        avatarUrl: json['avatar_url'] as String?,

      );

    }).toList();

  }



  List<BracketMatch> _parseMatches(List<dynamic> raw) {
    return raw
        .map((item) => BracketMatch.fromJson(item as Map<String, dynamic>))
        .toList();
  }



  TournamentParticipant? _parseParticipant(dynamic raw) {

    if (raw is! Map<String, dynamic>) return null;

    return TournamentParticipant(

      id: _asString(raw['id']),

      name: _asString(raw['name']),

      avatarUrl: raw['avatar_url'] as String?,

    );

  }



  TournamentStatus _parseStatus(String raw) {

    switch (raw) {

      case 'ongoing':

        return TournamentStatus.ongoing;

      case 'completed':

        return TournamentStatus.completed;

      case 'cancelled':

        return TournamentStatus.cancelled;

      default:

        return TournamentStatus.upcoming;

    }

  }



  MatchStatus _parseMatchStatus(String raw) {

    switch (raw) {

      case 'live':

        return MatchStatus.live;

      case 'completed':

        return MatchStatus.completed;

      default:

        return MatchStatus.upcoming;

    }

  }



  BracketRound _parseRound(String raw) {

    switch (raw) {

      case 'semi_final':

        return BracketRound.semiFinal;

      case 'final':

        return BracketRound.finalRound;

      default:

        return BracketRound.quarterFinal;

    }

  }



  void invalidateCache() => _cached = null;

}



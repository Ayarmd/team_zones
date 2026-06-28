import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/config/api_config.dart';
import '../../core/storage/auth_token_storage.dart';
import '../../models/auth_exception.dart';
import '../../models/zones_models.dart';

/// Customer auth — talks to Laravel Sanctum API (`/api/register`, `/api/login`).
class AuthRepository {
  AuthRepository._();
  static final AuthRepository instance = AuthRepository._();

  String? _authToken;

  String? get authToken => _authToken;

  Future<void> _persistToken(String? token) async {
    _authToken = token;
    if (token != null && token.isNotEmpty) {
      await AuthTokenStorage.save(token);
    } else {
      await AuthTokenStorage.clear();
    }
  }

  void clearToken() {
    _authToken = null;
    AuthTokenStorage.clear();
  }

  Future<UserModel?> restoreSession() async {
    final stored = await AuthTokenStorage.load();
    if (stored == null || stored.isEmpty) return null;

    _authToken = stored;
    final uri = Uri.parse('${ApiConfig.apiUrl}/profile');

    try {
      final response = await http
          .get(uri, headers: authHeaders)
          .timeout(const Duration(seconds: 20));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 200) {
        final userJson = body?['user'];
        if (userJson is Map<String, dynamic>) {
          return _userFromJson(userJson);
        }
      }

      clearToken();
      return null;
    } catch (_) {
      clearToken();
      return null;
    }
  }

  String _normalizeEmail(String email) => email.trim().toLowerCase();

  Map<String, String> get _jsonHeaders => const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  Map<String, String> get authHeaders => {
        ..._jsonHeaders,
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  UserModel _userFromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int?,
      name: (json['name'] ?? json['full_name'] ?? '') as String,
      phone: (json['phone'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      profileImage: json['profile_image'] as String?,
    );
  }

  AuthException _mapApiError(int statusCode, Map<String, dynamic>? body) {
    final message = body?['message'] as String?;
    final errors = body?['errors'];

    if (statusCode == 422 && errors is Map) {
      if (errors['email'] != null) {
        return const AuthException(
          AuthErrorType.emailAlreadyRegistered,
          'هذا البريد الإلكتروني مسجل مسبقاً',
        );
      }
      final first = errors.values.first;
      if (first is List && first.isNotEmpty) {
        return AuthException(AuthErrorType.serverError, first.first.toString());
      }
    }

    if (statusCode == 403) {
      if (message?.contains('disabled') == true || message?.contains('inactive') == true) {
        return const AuthException(
          AuthErrorType.userNotFound,
          'Your account has been disabled.',
        );
      }
      return AuthException(
        AuthErrorType.userNotFound,
        message?.contains('deleted') == true
            ? 'تم حذف هذا الحساب. يرجى إنشاء حساب جديد.'
            : (message ?? 'لا يمكن تسجيل الدخول بهذا الحساب'),
      );
    }

    if (statusCode == 404) {
      return AuthException(
        AuthErrorType.userNotFound,
        message ?? 'لا يوجد حساب مسجل بهذا البريد الإلكتروني',
      );
    }

    if (statusCode == 422 && message != null && message.contains('رمز')) {
      return AuthException(AuthErrorType.invalidCode, message);
    }

    if (statusCode == 401 || statusCode == 422) {
      return const AuthException(
        AuthErrorType.wrongPassword,
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    return AuthException(
      AuthErrorType.serverError,
      message ?? 'حدث خطأ من الخادم، حاول مرة أخرى',
    );
  }

  Future<UserModel> signUp({
    required String name,
    required String phone,
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}/register');

    try {
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({
              'name': name.trim(),
              'phone': phone.trim(),
              'email': _normalizeEmail(email),
              'password': password,
              'password_confirmation': password,
            }),
          )
          .timeout(const Duration(seconds: 20));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 201 || response.statusCode == 200) {
        final token = body?['token'] as String?;
        if (token != null) {
          await _persistToken(token);
        }
        final userJson = body?['user'];
        if (userJson is Map<String, dynamic>) {
          return _userFromJson(userJson);
        }
        return UserModel(
          name: name.trim(),
          phone: phone.trim(),
          email: _normalizeEmail(email),
        );
      }

      throw _mapApiError(response.statusCode, body);
    } on AuthException {
      rethrow;
    } catch (_) {
      throw AuthException(
        AuthErrorType.networkError,
        'تعذر الاتصال بالخادم.\n${ApiConfig.connectivityHint}',
      );
    }
  }

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}/login');

    try {
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({
              'email': _normalizeEmail(email),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 20));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 200) {
        final token = body?['token'] as String?;
        if (token == null || token.isEmpty) {
          throw const AuthException(
            AuthErrorType.serverError,
            'لم يُرجع الخادم رمز الدخول',
          );
        }
        await _persistToken(token);

        final userJson = body?['user'];
        if (userJson is Map<String, dynamic>) {
          return _userFromJson(userJson);
        }

        throw const AuthException(
          AuthErrorType.serverError,
          'استجابة غير متوقعة من الخادم',
        );
      }

      if (response.statusCode == 422) {
        throw const AuthException(
          AuthErrorType.wrongPassword,
          'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        );
      }

      throw _mapApiError(response.statusCode, body);
    } on AuthException {
      rethrow;
    } catch (_) {
      throw AuthException(
        AuthErrorType.networkError,
        'تعذر الاتصال بالخادم.\n${ApiConfig.connectivityHint}',
      );
    }
  }

  Future<UserModel> loginWithGoogle({required String idToken}) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}${ApiConfig.authGoogle}');

    try {
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({'id_token': idToken}),
          )
          .timeout(const Duration(seconds: 20));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 200) {
        final token = body?['token'] as String?;
        if (token == null || token.isEmpty) {
          throw const AuthException(
            AuthErrorType.serverError,
            'لم يُرجع الخادم رمز الدخول',
          );
        }
        await _persistToken(token);

        final userJson = body?['user'];
        if (userJson is Map<String, dynamic>) {
          return _userFromJson(userJson);
        }

        throw const AuthException(
          AuthErrorType.serverError,
          'استجابة غير متوقعة من الخادم',
        );
      }

      throw _mapApiError(response.statusCode, body);
    } on AuthException {
      rethrow;
    } catch (_) {
      throw AuthException(
        AuthErrorType.networkError,
        'تعذر الاتصال بالخادم.\n${ApiConfig.connectivityHint}',
      );
    }
  }

  Future<void> deleteAccount() async {
    final uri = Uri.parse('${ApiConfig.apiUrl}/profile/delete');

    try {
      final response = await http
          .delete(uri, headers: authHeaders)
          .timeout(const Duration(seconds: 20));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 200) {
        clearToken();
        return;
      }

      throw _mapApiError(response.statusCode, body);
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException(
        AuthErrorType.networkError,
        'تعذر حذف الحساب. تحقق من الاتصال بالخادم.',
      );
    }
  }

  Future<void> sendPasswordResetCode({required String email}) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}/forgot-password');

    try {
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({'email': _normalizeEmail(email)}),
          )
          .timeout(const Duration(seconds: 30));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 200) {
        return;
      }

      throw _mapApiError(response.statusCode, body);
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException(
        AuthErrorType.networkError,
        'تعذر إرسال رمز التحقق. تحقق من الاتصال بالخادم.',
      );
    }
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String password,
  }) async {
    final uri = Uri.parse('${ApiConfig.apiUrl}/reset-password');

    try {
      final response = await http
          .post(
            uri,
            headers: _jsonHeaders,
            body: jsonEncode({
              'email': _normalizeEmail(email),
              'code': code,
              'password': password,
              'password_confirmation': password,
            }),
          )
          .timeout(const Duration(seconds: 20));

      Map<String, dynamic>? body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {}

      if (response.statusCode == 200) {
        return;
      }

      throw _mapApiError(response.statusCode, body);
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException(
        AuthErrorType.networkError,
        'تعذر تغيير كلمة المرور. تحقق من الاتصال بالخادم.',
      );
    }
  }
}

import 'package:shared_preferences/shared_preferences.dart';

/// Persists Sanctum token across app restarts.
class AuthTokenStorage {
  AuthTokenStorage._();

  static const _key = 'zones_customer_auth_token';

  static Future<void> save(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, token);
  }

  static Future<String?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_key);
    if (token == null || token.isEmpty) return null;
    return token;
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

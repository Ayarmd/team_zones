import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/repositories/auth_repository.dart';
import '../../../models/auth_exception.dart';
import '../../../models/zones_models.dart';
import '../../../services/google_sign_in_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc({
    AuthRepository? repository,
    GoogleSignInService? googleSignIn,
  })  : _repository = repository ?? AuthRepository.instance,
        _googleSignIn = googleSignIn ?? GoogleSignInService.instance,
        super(const AuthInitial()) {
    on<AuthLoginRequested>(_onLogin);
    on<AuthGoogleSignInRequested>(_onGoogleSignIn);
    on<AuthRegisterRequested>(_onRegister);
    on<AuthLogoutRequested>(_onLogout);
    on<AuthDeleteAccountRequested>(_onDeleteAccount);
    on<AuthSessionRestoreRequested>(_onRestoreSession);
  }

  final AuthRepository _repository;
  final GoogleSignInService _googleSignIn;

  UserModel? get currentUser {
    final state = this.state;
    if (state is AuthAuthenticated) return state.user;
    return null;
  }

  bool get isAuthenticated => state is AuthAuthenticated;

  Future<void> _onLogin(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final user = await _repository.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthAuthenticated(user));
    } on AuthException catch (e) {
      emit(AuthFailure(e.message));
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onGoogleSignIn(
    AuthGoogleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final idToken = await _googleSignIn.signInAndGetIdToken();
      if (idToken == null) {
        emit(const AuthUnauthenticated());
        return;
      }

      final user = await _repository.loginWithGoogle(idToken: idToken);
      emit(AuthAuthenticated(user));
    } on AuthException catch (e) {
      emit(AuthFailure(e.message));
      emit(const AuthUnauthenticated());
    } catch (_) {
      emit(const AuthFailure('تعذر تسجيل الدخول عبر Google'));
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onRegister(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      await _repository.signUp(
        name: event.name,
        phone: event.phone,
        email: event.email,
        password: event.password,
      );
      emit(AuthRegistrationSuccess(event.email));
      emit(const AuthUnauthenticated());
    } on AuthException catch (e) {
      emit(AuthFailure(e.message));
      emit(const AuthUnauthenticated());
    }
  }

  void _onLogout(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) {
    _repository.clearToken();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onDeleteAccount(
    AuthDeleteAccountRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      await _repository.deleteAccount();
      emit(const AuthUnauthenticated());
    } on AuthException catch (e) {
      emit(AuthFailure(e.message));
    }
  }

  Future<void> _onRestoreSession(
    AuthSessionRestoreRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final user = await _repository.restoreSession();
      if (user != null) {
        emit(AuthAuthenticated(user));
      } else {
        emit(const AuthUnauthenticated());
      }
    } catch (_) {
      emit(const AuthUnauthenticated());
    }
  }
}

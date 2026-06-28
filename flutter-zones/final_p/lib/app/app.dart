import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import '../core/routes/app_routes.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_event.dart';
import '../features/notifications/bloc/notification_bloc.dart';
import '../providers/branding_provider.dart';
import '../providers/app_state_provider.dart';
import '../providers/lounge_ratings_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/tournament_provider.dart';
import '../providers/zones_data_provider.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/otp_verification_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/auth/sign_up_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/tournaments/active_tournament_registrations_screen.dart';
import '../services/push_notification_service.dart';
import 'notification_listener_shell.dart';
import 'session_sync_listener.dart';

class ZonezApp extends StatelessWidget {
  const ZonezApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final branding = context.watch<BrandingProvider>();

    return SessionSyncListener(
      child: MaterialApp(
        navigatorKey: PushNotificationService.navigatorKey,
        title: branding.platformName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: themeProvider.themeMode,
        locale: const Locale('ar'),
        supportedLocales: const [Locale('ar'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        builder: (context, child) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: NotificationListenerShell(
              child: child!,
            ),
          );
        },
        initialRoute: AppRoutes.login,
        routes: {
          AppRoutes.splash: (_) => const SplashScreen(),
          AppRoutes.login: (_) => const LoginScreen(),
          AppRoutes.signUp: (_) => const SignUpScreen(),
          AppRoutes.forgotPassword: (_) => const ForgotPasswordScreen(),
          AppRoutes.otpVerification: (_) => const OtpVerificationScreen(),
          AppRoutes.resetPassword: (_) => const ResetPasswordScreen(),
          AppRoutes.home: (_) => const HomeScreen(),
          AppRoutes.profile: (_) => const ProfileScreen(),
          AppRoutes.tournamentHistory: (_) =>
              const ActiveTournamentRegistrationsScreen(),
        },
      ),
    );
  }
}

class ZonezRoot extends StatelessWidget {
  const ZonezRoot({super.key, required this.brandingProvider});

  final BrandingProvider brandingProvider;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => AuthBloc()..add(const AuthSessionRestoreRequested()),
        ),
        BlocProvider(create: (_) => NotificationBloc()),
      ],
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider<BrandingProvider>.value(value: brandingProvider),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ChangeNotifierProvider(create: (_) => AppStateProvider()),
          ChangeNotifierProvider(create: (_) => ZonesDataProvider()),
          ChangeNotifierProvider(create: (_) => LoungeRatingsProvider()),
          ChangeNotifierProvider(create: (_) => TournamentProvider()),
        ],
        child: const ZonezApp(),
      ),
    );
  }
}

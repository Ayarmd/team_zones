import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';

import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_state.dart';
import '../features/notifications/bloc/notification_bloc.dart';
import '../features/notifications/bloc/notification_event.dart';
import '../providers/app_state_provider.dart';
import '../providers/zones_data_provider.dart';
import '../services/zones_api_service.dart';

/// Bridges AuthBloc success into legacy Provider session state.
class SessionSyncListener extends StatelessWidget {
  const SessionSyncListener({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) async {
        if (state is AuthAuthenticated) {
          final user = state.user;
          final appState = context.read<AppStateProvider>();
          final zonesData = context.read<ZonesDataProvider>();

          ZonesApiService.instance.setCurrentUser(user);
          zonesData.applyUserProfile(user);
          appState.updateProfile(name: user.name, phone: user.phone);
          await appState.syncBookingsFromApi();
          await appState.syncBanStatusFromApi();
          if (!context.mounted) return;
          context.read<NotificationBloc>().add(const SyncFcmTokenRequested());
        }
      },
      child: child,
    );
  }
}

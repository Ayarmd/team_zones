<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('station_broadcasts') && ! Schema::hasTable('station_alerts')) {
            Schema::rename('station_broadcasts', 'station_alerts');
        }

        if (Schema::hasColumn('staff_notifications', 'broadcast_id')) {
            Schema::table('staff_notifications', function (Blueprint $table) {
                $table->dropForeign(['broadcast_id']);
            });

            Schema::table('staff_notifications', function (Blueprint $table) {
                $table->renameColumn('broadcast_id', 'station_alert_id');
            });

            Schema::table('staff_notifications', function (Blueprint $table) {
                $table->foreign('station_alert_id')
                    ->references('id')
                    ->on('station_alerts')
                    ->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('customer_notifications')) {
            DB::table('customer_notifications')
                ->where('type', 'manager_broadcast')
                ->update(['type' => 'station_alert']);
        }

        if (Schema::hasTable('staff_notifications')) {
            DB::table('staff_notifications')
                ->where('type', 'manager_broadcast')
                ->update(['type' => 'station_alert']);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('station_alerts') && ! Schema::hasTable('station_broadcasts')) {
            Schema::rename('station_alerts', 'station_broadcasts');
        }

        if (Schema::hasColumn('staff_notifications', 'station_alert_id')) {
            Schema::table('staff_notifications', function (Blueprint $table) {
                $table->dropForeign(['station_alert_id']);
            });

            Schema::table('staff_notifications', function (Blueprint $table) {
                $table->renameColumn('station_alert_id', 'broadcast_id');
            });

            Schema::table('staff_notifications', function (Blueprint $table) {
                $table->foreign('broadcast_id')
                    ->references('id')
                    ->on('station_broadcasts')
                    ->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('customer_notifications')) {
            DB::table('customer_notifications')
                ->where('type', 'station_alert')
                ->update(['type' => 'manager_broadcast']);
        }

        if (Schema::hasTable('staff_notifications')) {
            DB::table('staff_notifications')
                ->where('type', 'station_alert')
                ->update(['type' => 'manager_broadcast']);
        }
    }
};

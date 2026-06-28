<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('station_alerts')) {
            Schema::create('station_alerts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('station_id')->constrained()->cascadeOnDelete();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->string('name');
                $table->text('body');
                $table->string('target_audience', 64);
                $table->string('severity', 20)->default('medium');
                $table->string('status', 20)->default('active');
                $table->text('alternative_instructions')->nullable();
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->timestamps();

                $table->index(['station_id', 'status']);
            });
        }

        if (! Schema::hasTable('staff_notifications')) {
            Schema::create('staff_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('station_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('station_alert_id')->nullable()->constrained('station_alerts')->cascadeOnDelete();
                $table->string('type', 64);
                $table->string('title');
                $table->text('body');
                $table->json('payload')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'read_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_notifications');
        Schema::dropIfExists('station_alerts');
    }
};

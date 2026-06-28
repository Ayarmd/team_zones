<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('customer_no_show_counters')) {
            Schema::create('customer_no_show_counters', function (Blueprint $table) {
                $table->id();
                $table->string('phone_normalized', 32)->unique();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedTinyInteger('no_show_count')->default(0);
                $table->timestamps();

                $table->index('user_id');
            });
        }

        if (! Schema::hasTable('customer_bans')) {
            Schema::create('customer_bans', function (Blueprint $table) {
            $table->id();
            $table->string('phone_normalized', 32)->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->unsignedTinyInteger('no_show_count')->default(0);
            $table->dateTime('banned_at');
            $table->dateTime('banned_until');
            $table->boolean('active')->default(true);
            $table->timestamp('lifted_at')->nullable();
            $table->foreignId('lifted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('lift_note')->nullable();
            $table->string('reason')->default('3_no_shows');
            $table->foreignId('trigger_booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->timestamps();

            $table->index(['phone_normalized', 'active']);
            $table->index(['user_id', 'active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_bans');
        Schema::dropIfExists('customer_no_show_counters');
    }
};

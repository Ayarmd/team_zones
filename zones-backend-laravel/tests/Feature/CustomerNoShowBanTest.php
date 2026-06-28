<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\CustomerBan;
use App\Models\CustomerNoShowCounter;
use App\Models\Device;
use App\Models\Package;
use App\Models\Station;
use App\Models\User;
use App\Services\CustomerBanService;
use App\Support\BookingStatus;
use App\Support\SessionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerNoShowBanTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('customer');
        Role::findOrCreate('reception');
    }

    public function test_command_marks_overdue_booking_as_no_show(): void
    {
        [$station, $package, $device] = $this->createStationFixture();
        $customer = User::factory()->create(['phone' => '0912345678']);
        $customer->assignRole('customer');

        $booking = $this->createAwaitingBooking($station, $package, $device, $customer, now()->subMinutes(20));

        $this->artisan('bookings:process-no-shows')->assertSuccessful();

        $booking->refresh();
        $this->assertSame(BookingStatus::CANCELLED, $booking->booking_status);
        $this->assertSame(SessionStatus::NO_SHOW, $booking->session_status);
        $this->assertNotNull($booking->cancelled_at);

        $counter = CustomerNoShowCounter::query()->where('phone_normalized', '0912345678')->first();
        $this->assertNotNull($counter);
        $this->assertSame(1, $counter->no_show_count);
    }

    public function test_three_no_shows_create_three_day_ban(): void
    {
        [$station, $package, $device] = $this->createStationFixture();
        $customer = User::factory()->create(['phone' => '0922222222']);
        $customer->assignRole('customer');

        for ($i = 0; $i < 3; $i++) {
            $this->createAwaitingBooking(
                $station,
                $package,
                $device,
                $customer,
                now()->subMinutes(20 + $i),
                'BK-00'.($i + 1),
            );
            $this->artisan('bookings:process-no-shows')->assertSuccessful();
        }

        $ban = CustomerBan::query()->where('phone_normalized', '0922222222')->first();
        $this->assertNotNull($ban);
        $this->assertTrue($ban->isCurrentlyActive());
        $this->assertSame(3, $ban->no_show_count);
        $this->assertTrue($ban->banned_until->greaterThan(now()->addDays(2)));

        $counter = CustomerNoShowCounter::query()->where('phone_normalized', '0922222222')->first();
        $this->assertSame(0, $counter->no_show_count);
    }

    public function test_banned_customer_cannot_create_app_booking(): void
    {
        [$station, $package, $device] = $this->createStationFixture();
        $customer = User::factory()->create(['phone' => '0933333333']);
        $customer->assignRole('customer');
        $token = $customer->createToken('test')->plainTextToken;

        CustomerBan::create([
            'phone_normalized' => '0933333333',
            'user_id' => $customer->id,
            'customer_name' => $customer->full_name,
            'no_show_count' => CustomerBanService::BAN_THRESHOLD,
            'banned_at' => now(),
            'banned_until' => now()->addDays(CustomerBanService::BAN_DAYS),
            'active' => true,
            'reason' => '3_no_shows',
        ]);

        $response = $this->withToken($token)->postJson('/api/bookings', [
            'station_id' => $station->id,
            'package_id' => $package->id,
            'device_id' => $device->id,
            'date' => now()->addDay()->format('Y-m-d'),
            'hour' => '14:00',
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['booking']);
    }

    public function test_customer_can_read_ban_status_endpoint(): void
    {
        $customer = User::factory()->create(['phone' => '0944444444']);
        $customer->assignRole('customer');
        $token = $customer->createToken('test')->plainTextToken;

        CustomerBan::create([
            'phone_normalized' => '0944444444',
            'user_id' => $customer->id,
            'no_show_count' => 3,
            'banned_at' => now(),
            'banned_until' => now()->addDays(3),
            'active' => true,
            'reason' => '3_no_shows',
        ]);

        $response = $this->withToken($token)->getJson('/api/customer/ban-status');

        $response->assertOk()
            ->assertJsonPath('is_banned', true)
            ->assertJsonPath('ban_threshold', 3)
            ->assertJsonPath('grace_minutes', 14);
    }

    public function test_reception_can_mark_no_show_manually(): void
    {
        [$station, $package, $device] = $this->createStationFixture();
        $reception = User::factory()->create(['station_id' => $station->id]);
        $reception->assignRole('reception');
        $token = $reception->createToken('test')->plainTextToken;

        $booking = $this->createAwaitingBooking(
            $station,
            $package,
            $device,
            null,
            now()->addHour(),
            'BK-MANUAL',
            '0955555555',
        );

        $response = $this->withToken($token)->postJson("/api/staff/reception/calendar/{$booking->id}/no-show");

        $response->assertOk()
            ->assertJsonPath('ban_created', false)
            ->assertJsonPath('no_show_count', 1)
            ->assertJsonPath('slot.attendanceStatus', 'no_show');

        $booking->refresh();
        $this->assertSame(SessionStatus::NO_SHOW, $booking->session_status);
    }

    public function test_reception_can_lift_active_ban(): void
    {
        [$station] = $this->createStationFixture();
        $reception = User::factory()->create(['station_id' => $station->id]);
        $reception->assignRole('reception');
        $token = $reception->createToken('test')->plainTextToken;

        $ban = CustomerBan::create([
            'phone_normalized' => '0966666666',
            'no_show_count' => 3,
            'banned_at' => now(),
            'banned_until' => now()->addDays(3),
            'active' => true,
            'reason' => '3_no_shows',
        ]);

        $response = $this->withToken($token)->postJson("/api/staff/reception/bans/{$ban->id}/lift", [
            'note' => 'فك حظر تجريبي',
        ]);

        $response->assertOk();
        $ban->refresh();
        $this->assertFalse($ban->active);
        $this->assertNotNull($ban->lifted_at);
        $this->assertSame($reception->id, $ban->lifted_by);
    }

    public function test_customer_cannot_cancel_within_fifteen_minutes_of_start(): void
    {
        [$station, $package, $device] = $this->createStationFixture();
        $customer = User::factory()->create(['phone' => '0977777777']);
        $customer->assignRole('customer');
        $token = $customer->createToken('test')->plainTextToken;

        $booking = $this->createAwaitingBooking(
            $station,
            $package,
            $device,
            $customer,
            now()->addMinutes(10),
            'BK-LOCK',
        );

        $response = $this->withToken($token)->postJson("/api/bookings/{$booking->id}/cancel");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['booking']);
    }

    public function test_customer_can_cancel_more_than_fifteen_minutes_before_start(): void
    {
        [$station, $package, $device] = $this->createStationFixture();
        $customer = User::factory()->create(['phone' => '0988888888']);
        $customer->assignRole('customer');
        $token = $customer->createToken('test')->plainTextToken;

        $booking = $this->createAwaitingBooking(
            $station,
            $package,
            $device,
            $customer,
            now()->addHour(),
            'BK-OK',
        );

        $response = $this->withToken($token)->postJson("/api/bookings/{$booking->id}/cancel");

        $response->assertOk();
        $booking->refresh();
        $this->assertSame(BookingStatus::CANCELLED, $booking->booking_status);
    }

    /**
     * @return array{0: Station, 1: Package, 2: Device}
     */
    private function createStationFixture(): array
    {
        $station = Station::create([
            'name' => 'Test Lounge',
            'slug' => 'test-lounge-'.uniqid(),
            'is_active' => true,
            'is_published' => true,
            'bookings_enabled' => true,
        ]);

        $package = Package::create([
            'station_id' => $station->id,
            'name' => 'Standard',
            'slug' => 'standard-'.$station->id,
            'package_type' => 'ps5',
            'hourly_price' => 50,
            'minimum_hours' => 1,
            'is_active' => true,
        ]);

        $device = Device::create([
            'station_id' => $station->id,
            'package_id' => $package->id,
            'device_code' => 'PS5-01',
            'display_name' => 'PS5-01',
            'device_type' => 'ps5',
            'operational_status' => 'active',
        ]);

        return [$station, $package, $device];
    }

    private function createAwaitingBooking(
        Station $station,
        Package $package,
        Device $device,
        ?User $customer,
        \DateTimeInterface $startAt,
        string $bookingNumber = 'BK-001',
        ?string $visitorPhone = null,
    ): Booking {
        $date = $startAt->format('Y-m-d');
        $hour = $startAt->format('H:i:s');

        return Booking::create([
            'user_id' => $customer?->id,
            'station_id' => $station->id,
            'device_id' => $device->id,
            'package_id' => $package->id,
            'booking_number' => $bookingNumber,
            'booking_type' => 'regular',
            'visitor_name' => $customer?->full_name ?? 'زبون',
            'visitor_phone' => $visitorPhone ?? $customer?->phone,
            'start_date' => $date,
            'end_date' => $date,
            'start_time' => $hour,
            'end_time' => date('H:i:s', strtotime($hour.' +1 hour')),
            'hours_count' => 1,
            'original_hourly_price' => 50,
            'discounted_hourly_price' => 50,
            'subtotal_price' => 50,
            'total_price' => 50,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'booking_status' => BookingStatus::CONFIRMED,
            'session_status' => SessionStatus::WAITING,
            'is_checked_in' => false,
            'booking_source' => $customer ? 'mobile_app' : 'dashboard',
        ]);
    }
}

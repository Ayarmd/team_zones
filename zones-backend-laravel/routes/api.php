<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BrandingLogoController;
use App\Http\Controllers\Api\BrandingSettingsController;
use App\Http\Controllers\Api\ProfileAvatarController;
use App\Http\Controllers\Api\DeviceRatingController;
use App\Http\Controllers\Api\ManagerCommentController;
use App\Http\Controllers\Api\ManagerExpenseController;
use App\Http\Controllers\Api\ManagerFinanceController;
use App\Http\Controllers\Api\StationCommentController;
use App\Http\Controllers\Api\CustomerBanController;
use App\Http\Controllers\Api\CustomerBookingController;
use App\Http\Controllers\Api\PlutuPaymentController;
use App\Http\Controllers\Api\BookingReceiptController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeAuthController;
use App\Http\Controllers\Api\HallJoinRequestController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\LoungeBookingStopController;
use App\Http\Controllers\Api\LoungeCatalogController;
use App\Http\Controllers\Api\ManagerBookingStopController;
use App\Http\Controllers\Api\ManagerEmployeeController;
use App\Http\Controllers\Api\ManagerDeviceController;
use App\Http\Controllers\Api\ManagerOfferController;
use App\Http\Controllers\Api\ManagerPackageController;
use App\Http\Controllers\Api\ManagerStationController;
use App\Http\Controllers\Api\ReceptionBanController;
use App\Http\Controllers\Api\ReceptionCalendarController;
use App\Http\Controllers\Api\StaffHallCatalogController;
use App\Http\Controllers\Api\MaintenanceFaultController;
use App\Http\Controllers\Api\ManagerAuthController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\CustomerLoyaltyController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\LoyaltySettingsController;
use App\Http\Controllers\Api\PlatformCommissionController;
use App\Http\Controllers\Api\SuperAdminAuthController;
use App\Http\Controllers\Api\SuperAdminStaffController;
use App\Http\Controllers\Api\StaffAuthController;
use App\Http\Controllers\Api\ManagerTournamentController;
use App\Http\Controllers\Api\ManagerTournamentBracketController;
use App\Http\Controllers\Api\ManagerAlertController;
use App\Http\Controllers\Api\StaffNotificationController;
use App\Http\Controllers\Api\TournamentController;
Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);

Route::post('/auth/google', [AuthController::class, 'loginWithGoogle']);

Route::post('/forgot-password', [PasswordResetController::class, 'sendCode']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

Route::post('/super-admin/register', [SuperAdminAuthController::class, 'register']);
Route::post('/super-admin/login', [SuperAdminAuthController::class, 'login']);

Route::post(
    '/complete-registration',
    [InvitationController::class, 'completeRegistration']
);

Route::get('/invitations/{token}', [InvitationController::class, 'showByToken']);

Route::post('/hall-join-requests', [HallJoinRequestController::class, 'store']);

Route::post('/manager/login', [ManagerAuthController::class, 'login']);

Route::post('/staff/login', [StaffAuthController::class, 'login']);

Route::post('/employee/login', [EmployeeAuthController::class, 'login']);

Route::get('/lounges', [LoungeCatalogController::class, 'index']);
Route::get('/lounges/nearby', [LoungeCatalogController::class, 'nearby']);
Route::get('/lounges/{station}', [LoungeCatalogController::class, 'show']);

Route::get('/offers', [OfferController::class, 'index']);
Route::get('/offers/{offer}', [OfferController::class, 'show']);

Route::get('/tournaments', [TournamentController::class, 'index']);
Route::get('/tournaments/{tournament}', [TournamentController::class, 'show']);

Route::get('/loyalty/settings', [LoyaltySettingsController::class, 'show']);

Route::get('/public/branding-settings', [BrandingSettingsController::class, 'show']);

Route::get('/lounges/{station}/comments', [StationCommentController::class, 'index'])
    ->middleware('auth.optional');

Route::get('/lounges/{station}/booking-stop', [LoungeBookingStopController::class, 'show']);

Route::post('/payments/plutu/local-bank/create', [PlutuPaymentController::class, 'createLocalBankPayment']);
Route::get('/payments/plutu/transactions/{invoiceNo}', [PlutuPaymentController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/hall-join-requests', [HallJoinRequestController::class, 'index']);
    Route::post('/hall-join-requests/{hallJoinRequest}/accept', [HallJoinRequestController::class, 'accept']);
    Route::post('/hall-join-requests/{hallJoinRequest}/reject', [HallJoinRequestController::class, 'reject']);

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [ProfileAvatarController::class, 'store']);
    Route::put('/profile/avatar', [ProfileAvatarController::class, 'update']);
    Route::delete('/profile/avatar', [ProfileAvatarController::class, 'destroy']);
    Route::post('/device-tokens', [DeviceTokenController::class, 'store']);
    Route::put('/profile/change-password', [AuthController::class, 'changePassword']);
    Route::delete('/profile/delete', [AuthController::class, 'deleteAccount']);
    Route::get('/manager/station', [ManagerStationController::class, 'show'])
        ->middleware('role:manager');
    Route::put('/manager/station', [ManagerStationController::class, 'update'])
        ->middleware('role:manager');
    Route::post('/manager/station', [ManagerStationController::class, 'update'])
        ->middleware('role:manager');
    Route::post('/manager/station/reset', [ManagerStationController::class, 'reset'])
        ->middleware('role:manager');

    Route::get('/manager/devices', [ManagerDeviceController::class, 'index'])
        ->middleware('role:manager');
    Route::post('/manager/devices', [ManagerDeviceController::class, 'store'])
        ->middleware('role:manager');
    Route::put('/manager/devices/{device}', [ManagerDeviceController::class, 'update'])
        ->middleware('role:manager');
    Route::delete('/manager/devices/{device}', [ManagerDeviceController::class, 'destroy'])
        ->middleware('role:manager');

    Route::get('/manager/packages', [ManagerPackageController::class, 'index'])
        ->middleware('role:manager');
    Route::post('/manager/packages', [ManagerPackageController::class, 'store'])
        ->middleware('role:manager');
    Route::put('/manager/packages/{package}', [ManagerPackageController::class, 'update'])
        ->middleware('role:manager');
    Route::delete('/manager/packages/{package}', [ManagerPackageController::class, 'destroy'])
        ->middleware('role:manager');

    Route::get('/manager/offers', [ManagerOfferController::class, 'index'])
        ->middleware('role:manager|reception');
    Route::post('/manager/offers', [ManagerOfferController::class, 'store'])
        ->middleware('role:manager');
    Route::put('/manager/offers/{offer}', [ManagerOfferController::class, 'update'])
        ->middleware('role:manager');
    Route::delete('/manager/offers/{offer}', [ManagerOfferController::class, 'destroy'])
        ->middleware('role:manager');

    Route::get('/manager/alerts', [ManagerAlertController::class, 'index'])
        ->middleware('role:manager');
    Route::post('/manager/alerts', [ManagerAlertController::class, 'store'])
        ->middleware('role:manager');
    Route::post('/manager/alerts/{alert}/stop', [ManagerAlertController::class, 'stop'])
        ->middleware('role:manager');
    Route::patch('/manager/alerts/{alert}/archive', [ManagerAlertController::class, 'archive'])
        ->middleware('role:manager');

    Route::get('/manager/booking-stops/reasons', [ManagerBookingStopController::class, 'reasons'])
        ->middleware('role:manager');
    Route::get('/manager/booking-stops', [ManagerBookingStopController::class, 'index'])
        ->middleware('role:manager');
    Route::post('/manager/booking-stops', [ManagerBookingStopController::class, 'store'])
        ->middleware('role:manager');
    Route::put('/manager/booking-stops/{bookingStop}', [ManagerBookingStopController::class, 'update'])
        ->middleware('role:manager');
    Route::patch('/manager/booking-stops/{bookingStop}/resume', [ManagerBookingStopController::class, 'resume'])
        ->middleware('role:manager');
    Route::delete('/manager/booking-stops/{bookingStop}', [ManagerBookingStopController::class, 'destroy'])
        ->middleware('role:manager');

    Route::get('/staff/notifications', [StaffNotificationController::class, 'index'])
        ->middleware('role:manager|reception|maintenance');
    Route::post('/staff/notifications/{notification}/read', [StaffNotificationController::class, 'markRead'])
        ->middleware('role:manager|reception|maintenance');
    Route::delete('/staff/notifications/{notification}', [StaffNotificationController::class, 'destroy'])
        ->middleware('role:manager|reception|maintenance');
    Route::post('/staff/notifications/delete-batch', [StaffNotificationController::class, 'destroyBatch'])
        ->middleware('role:manager|reception|maintenance');
    Route::delete('/staff/notifications', [StaffNotificationController::class, 'destroyAll'])
        ->middleware('role:manager|reception|maintenance');

    Route::get('/manager/tournaments', [ManagerTournamentController::class, 'index'])
        ->middleware('role:manager|reception');
    Route::post('/manager/tournaments', [ManagerTournamentController::class, 'store'])
        ->middleware('role:manager');
    Route::get('/manager/tournaments/{tournament}', [ManagerTournamentController::class, 'show'])
        ->middleware('role:manager|reception');
    Route::put('/manager/tournaments/{tournament}', [ManagerTournamentController::class, 'update'])
        ->middleware('role:manager');
    Route::post('/manager/tournaments/{tournament}/cancel', [ManagerTournamentController::class, 'cancel'])
        ->middleware('role:manager');
    Route::get('/manager/tournaments/{tournament}/participants', [ManagerTournamentController::class, 'participants'])
        ->middleware('role:manager|reception');
    Route::get('/manager/tournaments/{tournament}/bracket', [ManagerTournamentBracketController::class, 'show'])
        ->middleware('role:manager|reception');
    Route::patch('/manager/tournaments/{tournament}/matches/{match}', [ManagerTournamentBracketController::class, 'updateMatch'])
        ->middleware('role:manager|reception');
    Route::post('/manager/tournaments/{tournament}/notify-winner', [ManagerTournamentBracketController::class, 'notifyWinner'])
        ->middleware('role:manager');

    Route::get('/manager/employees', [ManagerEmployeeController::class, 'index'])
        ->middleware('role:manager');
    Route::put('/manager/employees/{employee}', [ManagerEmployeeController::class, 'update'])
        ->middleware('role:manager');
    Route::delete('/manager/employees/invitations/{invitation}', [ManagerEmployeeController::class, 'destroyInvitation'])
        ->middleware('role:manager');

    Route::get('/staff/hall-catalog', [StaffHallCatalogController::class, 'show'])
        ->middleware('role:manager|reception|maintenance');

    Route::get('/staff/maintenance/faults', [MaintenanceFaultController::class, 'index'])
        ->middleware('role:manager|maintenance');
    Route::post('/staff/maintenance/faults', [MaintenanceFaultController::class, 'store'])
        ->middleware('role:manager|maintenance');
    Route::post('/staff/maintenance/faults/{fault}/start', [MaintenanceFaultController::class, 'start'])
        ->middleware('role:manager|maintenance');
    Route::post('/staff/maintenance/faults/{fault}/resolve', [MaintenanceFaultController::class, 'resolve'])
        ->middleware('role:manager|maintenance');

    Route::get('/staff/reception/calendar', [ReceptionCalendarController::class, 'index'])
        ->middleware('role:manager|reception');
    Route::get('/staff/reception/calendar/active', [ReceptionCalendarController::class, 'active'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/calendar', [ReceptionCalendarController::class, 'store'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/calendar/{booking}/cancel', [ReceptionCalendarController::class, 'cancel'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/calendar/{booking}/check-in', [ReceptionCalendarController::class, 'checkIn'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/calendar/{booking}/start', [ReceptionCalendarController::class, 'startSession'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/calendar/{booking}/end', [ReceptionCalendarController::class, 'endSession'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/calendar/{booking}/no-show', [ReceptionCalendarController::class, 'markNoShow'])
        ->middleware('role:manager|reception');

    Route::get('/staff/reception/bans', [ReceptionBanController::class, 'bans'])
        ->middleware('role:manager|reception');
    Route::get('/staff/reception/no-shows', [ReceptionBanController::class, 'noShows'])
        ->middleware('role:manager|reception');
    Route::post('/staff/reception/bans/{ban}/lift', [ReceptionBanController::class, 'lift'])
        ->middleware('role:manager|reception');

    Route::get('/bookings', [CustomerBookingController::class, 'index']);
    Route::get('/lounges/{station}/availability', [CustomerBookingController::class, 'availability']);
    Route::post('/bookings', [CustomerBookingController::class, 'store']);
    Route::get('/bookings/{booking}', [CustomerBookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [CustomerBookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/sync-payment', [CustomerBookingController::class, 'syncPayment']);

    Route::get('/loyalty/status', [CustomerLoyaltyController::class, 'status']);
    Route::get('/customer/ban-status', [CustomerBanController::class, 'status']);
    Route::post('/loyalty/notifications/{notification}/read', [CustomerLoyaltyController::class, 'markNotificationRead']);

    Route::post('/bookings/receipt/preview', [BookingReceiptController::class, 'previewPayload']);
    Route::post('/bookings/receipt/pdf', [BookingReceiptController::class, 'generateFromPayload']);
    Route::get('/bookings/{booking}/receipt/pdf', [BookingReceiptController::class, 'generateFromBooking']);

    Route::post('/send-invitation', [InvitationController::class, 'sendInvitation'])
        ->middleware('role:super_admin|manager');

    Route::post('/lounges/{station}/reviews', [LoungeCatalogController::class, 'storeReview']);
    Route::post('/lounges/{station}/device-ratings', [DeviceRatingController::class, 'store']);
    Route::post('/lounges/{station}/comments', [StationCommentController::class, 'store']);
    Route::put('/lounges/{station}/comments/{comment}', [StationCommentController::class, 'update']);

    Route::get('/manager/comments', [ManagerCommentController::class, 'index'])
        ->middleware('role:manager');
    Route::post('/manager/comments/{comment}/reply', [ManagerCommentController::class, 'reply'])
        ->middleware('role:manager');
    Route::delete('/manager/comments/{comment}', [ManagerCommentController::class, 'destroy'])
        ->middleware('role:manager');

    Route::get('/manager/finance/summary', [ManagerFinanceController::class, 'summary'])
        ->middleware('role:manager');
    Route::get('/manager/finance/overview', [ManagerFinanceController::class, 'overview'])
        ->middleware('role:manager');
    Route::get('/manager/finance/revenue/today', [ManagerFinanceController::class, 'todayRevenue'])
        ->middleware('role:manager');
    Route::get('/manager/finance/payments', [ManagerFinanceController::class, 'payments'])
        ->middleware('role:manager');

    Route::get('/manager/expenses', [ManagerExpenseController::class, 'index'])
        ->middleware('role:manager');
    Route::post('/manager/expenses', [ManagerExpenseController::class, 'store'])
        ->middleware('role:manager');
    Route::delete('/manager/expenses/bulk', [ManagerExpenseController::class, 'destroyBulk'])
        ->middleware('role:manager');
    Route::put('/manager/expenses/{expense}', [ManagerExpenseController::class, 'update'])
        ->middleware('role:manager');
    Route::delete('/manager/expenses/{expense}', [ManagerExpenseController::class, 'destroy'])
        ->middleware('role:manager');

    Route::post('/offers/{offer}/slots/{slot}/book', [OfferController::class, 'bookSlot']);
    Route::post('/tournaments/{tournament}/register', [TournamentController::class, 'register']);
    Route::post('/tournaments/{tournament}/unregister', [TournamentController::class, 'unregister']);
    Route::get('/tournaments/my/registrations', [TournamentController::class, 'myRegistrations']);
    Route::get('/tournaments/my/registrations/active', [TournamentController::class, 'myActiveRegistrations']);
    Route::get('/tournaments/my/registrations/history', [TournamentController::class, 'myParticipationHistory']);
    Route::get('/tournaments/{tournament}/bracket', [TournamentController::class, 'bracket']);

    Route::put('/super-admin/settings/loyalty', [LoyaltySettingsController::class, 'update'])
        ->middleware('role:super_admin');
    Route::get('/super-admin/settings/commission', [PlatformCommissionController::class, 'show'])
        ->middleware('role:super_admin');
    Route::put('/super-admin/settings/commission', [PlatformCommissionController::class, 'update'])
        ->middleware('role:super_admin');
    Route::post('/super-admin/branding/logo', [BrandingLogoController::class, 'store'])
        ->middleware('role:super_admin');
    Route::patch('/super-admin/branding/settings', [BrandingSettingsController::class, 'update'])
        ->middleware('role:super_admin');
    Route::get('/super-admin/finance/commissions', [PlatformCommissionController::class, 'summary'])
        ->middleware('role:super_admin');
    Route::get('/super-admin/staff', [SuperAdminStaffController::class, 'index'])
        ->middleware('role:super_admin');
    Route::patch('/super-admin/staff/{user}', [SuperAdminStaffController::class, 'update'])
        ->middleware('role:super_admin');
    Route::delete('/super-admin/staff/{user}', [SuperAdminStaffController::class, 'destroy'])
        ->middleware('role:super_admin');
    Route::post('/super-admin/staff/{user}/restore', [SuperAdminStaffController::class, 'restore'])
        ->middleware('role:super_admin');
});

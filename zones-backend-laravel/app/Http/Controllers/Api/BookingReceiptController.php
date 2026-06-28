<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingReceiptPdfService;
use App\Support\MediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingReceiptController extends Controller
{
    public function __construct(
        private readonly BookingReceiptPdfService $pdfService,
    ) {}

    /**
     * Generate booking receipt PDF from payload sent by Flutter / React.
     */
    public function generateFromPayload(Request $request)
    {
        $validated = $request->validate($this->payloadRules());

        $pdf = $this->pdfService->generate($validated);

        if ($request->boolean('save') && $request->filled('booking_id')) {
            $booking = Booking::query()->findOrFail($request->integer('booking_id'));
            $path = $this->pdfService->saveForBooking($booking, $validated);

            return response()->json([
                'message' => 'Receipt PDF generated',
                'receipt_pdf_path' => $path,
                'receipt_pdf_url' => MediaUrl::resolve($path),
            ]);
        }

        $filename = 'booking-'.($validated['booking_number'] ?? 'receipt').'.pdf';

        return $request->boolean('inline')
            ? $pdf->stream($filename)
            : $pdf->download($filename);
    }

    /**
     * Generate booking receipt PDF from an existing booking record.
     */
    public function generateFromBooking(Request $request, Booking $booking)
    {
        $this->authorizeBookingAccess($request, $booking);

        if ($request->boolean('save')) {
            $path = $this->pdfService->saveForBooking($booking);

            return response()->json([
                'message' => 'Receipt PDF generated',
                'receipt_pdf_path' => $path,
                'receipt_pdf_url' => MediaUrl::resolve($path),
            ]);
        }

        $pdf = $this->pdfService->generateFromBooking($booking);
        $filename = 'booking-'.$booking->booking_number.'.pdf';

        return $request->boolean('inline')
            ? $pdf->stream($filename)
            : $pdf->download($filename);
    }

    /**
     * Preview normalized receipt data as JSON (useful for Flutter/React debugging).
     */
    public function previewPayload(Request $request): JsonResponse
    {
        $validated = $request->validate($this->payloadRules());

        return response()->json([
            'receipt' => $this->pdfService->normalizePayload($validated),
        ]);
    }

    private function payloadRules(): array
    {
        return [
            'booking_type' => ['required', Rule::in(['regular', 'offer', 'loyalty'])],
            'station_name' => ['required', 'string', 'max:255'],
            'booking_number' => ['required', 'string', 'max:100'],
            'customer_name' => ['required', 'string', 'max:255'],
            'booking_date' => ['required', 'date'],
            'start_time' => ['required', 'string', 'max:20'],
            'end_time' => ['required', 'string', 'max:20'],
            'package_name' => ['required', 'string', 'max:255'],
            'device_code' => ['required', 'string', 'max:100'],
            'payment_method' => ['nullable', Rule::in(['online', 'on_arrival', 'electronic', 'cash', 'paid'])],

            'amount' => ['nullable', 'numeric', 'min:0', 'required_if:booking_type,regular'],
            'amount_before_discount' => ['nullable', 'numeric', 'min:0', 'required_if:booking_type,offer'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100', 'required_if:booking_type,offer'],
            'amount_after_discount' => ['nullable', 'numeric', 'min:0', 'required_if:booking_type,offer'],

            'loyalty_coupon_label' => ['nullable', 'string', 'max:255'],
            'loyalty_coupon_code' => ['nullable', 'string', 'max:100'],
            'loyalty_points_per_session' => ['nullable', 'integer', 'min:0', 'required_if:booking_type,loyalty'],
            'loyalty_points_total' => ['nullable', 'integer', 'min:0', 'required_if:booking_type,loyalty'],

            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
            'save' => ['nullable', 'boolean'],
            'inline' => ['nullable', 'boolean'],
        ];
    }

    private function authorizeBookingAccess(Request $request, Booking $booking): void
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if ($user->hasRole('super_admin')) {
            return;
        }

        if ($user->hasRole('customer') && (int) $booking->user_id === (int) $user->id) {
            return;
        }

        if ($user->hasAnyRole(['manager', 'reception', 'maintenance'])) {
            $stationId = method_exists($user, 'resolvedStationId') ? $user->resolvedStationId() : null;
            if ($stationId && (int) $booking->station_id === (int) $stationId) {
                return;
            }
        }

        abort(403, 'Unauthorized');
    }
}

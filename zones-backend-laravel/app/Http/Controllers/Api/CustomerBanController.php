<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CustomerBanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerBanController extends Controller
{
    public function __construct(
        private readonly CustomerBanService $bans,
    ) {}

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return response()->json($this->bans->customerStatusPayload($user));
    }
}

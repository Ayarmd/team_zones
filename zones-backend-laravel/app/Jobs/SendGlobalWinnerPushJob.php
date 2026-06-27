<?php

namespace App\Jobs;

use App\Models\DeviceToken;
use App\Services\FcmPushService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendGlobalWinnerPushJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $winnerName,
        public string $prizeDetails,
        public int $tournamentId,
        public string $tournamentTitle = '',
    ) {}

    public function handle(FcmPushService $fcm): void
    {
        if (! $fcm->isConfigured()) {
            Log::info('FCM not configured — skipping tournament winner push.', [
                'tournament_id' => $this->tournamentId,
            ]);

            return;
        }

        $title = '🏆 بطل جديد في منصة زونز!';
        $body = "مبروك للاعب {$this->winnerName} فوزه بالبطولة وحصوله على جائزة {$this->prizeDetails}! 🎉";

        $data = [
            'type' => 'tournament_winner',
            'tournament_id' => $this->tournamentId,
            'tournament_title' => $this->tournamentTitle,
        ];

        DeviceToken::query()
            ->whereHas('user', fn ($query) => $query->role('customer'))
            ->orderBy('id')
            ->chunkById(500, function ($rows) use ($fcm, $title, $body, $data) {
                $tokens = $rows->pluck('token')->filter()->unique()->values()->all();
                $result = $fcm->sendToTokens($tokens, $title, $body, $data);

                Log::info('Tournament winner FCM chunk sent', [
                    'tournament_id' => $this->tournamentId,
                    'chunk_size' => count($tokens),
                    'sent' => $result['sent'],
                    'failed' => $result['failed'],
                ]);
            });
    }
}

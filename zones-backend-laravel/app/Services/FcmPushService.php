<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class FcmPushService
{
    private ?string $accessToken = null;

    private ?int $tokenExpiresAt = null;

    public function isConfigured(): bool
    {
        $path = config('firebase.credentials');
        $projectId = $this->projectId();

        return $path && is_readable($path) && filled($projectId);
    }

    private function projectId(): ?string
    {
        if (filled(config('firebase.project_id'))) {
            return config('firebase.project_id');
        }

        $path = config('firebase.credentials');
        if (! $path || ! is_readable($path)) {
            return null;
        }

        $credentials = json_decode((string) file_get_contents($path), true);

        return is_array($credentials) ? ($credentials['project_id'] ?? null) : null;
    }

    /**
     * @param  list<string>  $tokens
     * @return array{sent: int, failed: int, skipped: int, reason: string|null}
     */
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        $validTokens = collect($tokens)
            ->map(fn ($token) => trim((string) $token))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($validTokens === []) {
            Log::info('FCM send skipped — no valid tokens', [
                'requested_tokens' => count($tokens),
            ]);

            return ['sent' => 0, 'failed' => 0, 'skipped' => 0, 'reason' => 'no_tokens'];
        }

        if (! $this->isConfigured()) {
            Log::warning('FCM send skipped — service not configured', [
                'token_count' => count($validTokens),
                'credentials_path' => config('firebase.credentials'),
                'project_id' => $this->projectId(),
            ]);

            return [
                'sent' => 0,
                'failed' => 0,
                'skipped' => count($validTokens),
                'reason' => 'not_configured',
            ];
        }

        try {
            $accessToken = $this->getAccessToken();
            $projectId = $this->projectId();
            $sent = 0;
            $failed = 0;

            $stringData = collect($data)->map(fn ($v) => (string) $v)->all();

            foreach ($validTokens as $token) {
                $payload = [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'data' => $stringData,
                        'android' => [
                            'priority' => 'HIGH',
                            'notification' => [
                                'channel_id' => 'zones_alerts',
                                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                            ],
                        ],
                        'apns' => [
                            'headers' => [
                                'apns-priority' => '10',
                            ],
                            'payload' => [
                                'aps' => [
                                    'sound' => 'default',
                                ],
                            ],
                        ],
                    ],
                ];

                $response = Http::withToken($accessToken)
                    ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $payload);

                if ($response->successful()) {
                    $sent++;
                } else {
                    $failed++;
                    Log::warning('FCM send failed', [
                        'token_prefix' => substr($token, 0, 16),
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                }
            }

            Log::info('FCM send batch complete', [
                'sent' => $sent,
                'failed' => $failed,
                'total' => count($validTokens),
            ]);

            return [
                'sent' => $sent,
                'failed' => $failed,
                'skipped' => 0,
                'reason' => $failed > 0 ? 'partial_failure' : null,
            ];
        } catch (Throwable $e) {
            Log::error('FCM send batch error', [
                'error' => $e->getMessage(),
                'token_count' => count($validTokens),
            ]);

            return [
                'sent' => 0,
                'failed' => count($validTokens),
                'skipped' => 0,
                'reason' => 'exception',
            ];
        }
    }

    private function getAccessToken(): string
    {
        if ($this->accessToken && $this->tokenExpiresAt > time() + 60) {
            return $this->accessToken;
        }

        $credentialsPath = config('firebase.credentials');
        $credentials = json_decode((string) file_get_contents($credentialsPath), true);

        if (! is_array($credentials)) {
            throw new \RuntimeException('Invalid Firebase credentials JSON.');
        }

        $jwt = $this->createJwt($credentials);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Failed to obtain Firebase access token: '.$response->body());
        }

        $this->accessToken = $response->json('access_token');
        $this->tokenExpiresAt = time() + (int) $response->json('expires_in', 3600);

        return $this->accessToken;
    }

    /** @param array<string, mixed> $credentials */
    private function createJwt(array $credentials): string
    {
        $now = time();
        $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode(json_encode([
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));

        $data = "{$header}.{$payload}";
        $privateKey = openssl_pkey_get_private($credentials['private_key']);

        if ($privateKey === false) {
            throw new \RuntimeException('Invalid Firebase private key.');
        }

        $signature = '';
        openssl_sign($data, $signature, $privateKey, OPENSSL_ALGORITHM_SHA256);

        return "{$data}.{$this->base64UrlEncode($signature)}";
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}

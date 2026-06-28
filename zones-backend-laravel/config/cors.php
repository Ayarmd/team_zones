<?php

$localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
];

$extraOrigins = array_values(array_filter(array_map(
    static fn (string $origin): string => rtrim(trim($origin), '/'),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
)));

$frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
if ($frontendUrl !== '') {
    $extraOrigins[] = $frontendUrl;
}

$originPatterns = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', '')),
)));

if ($originPatterns === []) {
    $originPatterns = [
        '#^https://[\w-]+\.vercel\.app$#',
    ];
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique(array_merge($localOrigins, $extraOrigins))),
    'allowed_origins_patterns' => $originPatterns,
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];

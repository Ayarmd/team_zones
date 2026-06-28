<?php

namespace App\Support;

final class PhoneNormalizer
{
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $value = trim($phone);
        if ($value === '') {
            return null;
        }

        $value = preg_replace('/\s+/', '', $value) ?? '';
        $value = preg_replace('/^\+218/', '0', $value) ?? '';
        $digits = preg_replace('/\D/', '', $value) ?? '';
        $digits = preg_replace('/^218/', '', $digits) ?? '';
        $digits = ltrim($digits, '0');

        if ($digits === '') {
            return null;
        }

        return '0'.$digits;
    }
}

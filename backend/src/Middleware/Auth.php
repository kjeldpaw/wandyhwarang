<?php

namespace App\Middleware;

class Auth
{
    /**
     * Verify JWT token from Authorization header
     */
    public static function verifyToken()
    {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? null;

        if (!$token) {
            return false;
        }

        // Remove "Bearer " prefix
        $token = str_replace('Bearer ', '', $token);

        return self::validateToken($token);
    }

    /**
     * Validate JWT token
     */
    private static function validateToken($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return false;
        }

        $header_encoded = $parts[0];
        $payload_encoded = $parts[1];
        $signature_encoded = $parts[2];

        $secret = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';

        $signature = hash_hmac(
            'sha256',
            "{$header_encoded}.{$payload_encoded}",
            $secret,
            true
        );
        $signature_check = self::base64UrlEncode($signature);

        if ($signature_encoded !== $signature_check) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($payload_encoded), true);

        if ($payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Get current admin from token
     */
    public static function getCurrentAdmin()
    {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? null;

        if (!$token) {
            return null;
        }

        $token = str_replace('Bearer ', '', $token);
        return self::validateToken($token);
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 4 - strlen($data) % 4));
    }
}

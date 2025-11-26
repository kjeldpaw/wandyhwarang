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
     * Get current user from token (admin, master, or user)
     */
    public static function getCurrentUser()
    {
        // Try getallheaders first, then fall back to $_SERVER
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? ($headers['authorization'] ?? null);

        // Fallback to $_SERVER for Apache/FastCGI environments
        if (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!$token) {
            return null;
        }

        $token = str_replace('Bearer ', '', $token);
        return self::validateToken($token);
    }

    /**
     * Get current admin from token (for backward compatibility)
     */
    public static function getCurrentAdmin()
    {
        return self::getCurrentUser();
    }

    /**
     * Check if current user has specific role
     */
    public static function checkRole($requiredRole)
    {
        $user = self::getCurrentUser();
        if (!$user) {
            return false;
        }

        // Admin can do everything
        if ($user['role'] === 'admin') {
            return true;
        }

        // Check if user has required role
        return $user['role'] === $requiredRole;
    }

    /**
     * Check if current user is admin
     */
    public static function isAdmin()
    {
        return self::checkRole('admin');
    }

    /**
     * Check if current user is master
     */
    public static function isMaster()
    {
        $user = self::getCurrentUser();
        return $user && ($user['role'] === 'master' || $user['role'] === 'admin');
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

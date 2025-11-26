<?php

namespace App\Controllers;


class AuthController
{

    /**
     * POST /api/auth/login - User login (user, master, or admin)
     */
    public function login()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Email and password are required'
                ]);
                return;
            }

            $userModel = new \App\Models\User();
            $user = $userModel->getByEmail($data['email']);

            if (!$user) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid credentials'
                ]);
                return;
            }

            // Verify password
            if (!password_verify($data['password'], $user['password'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid credentials'
                ]);
                return;
            }

            // Generate JWT token
            $token = $this->generateToken($user);

            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/auth/register - Register new user (user role only)
     */
    public function register()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Name, email, and password are required'
                ]);
                return;
            }

            // Check if user already exists
            $userModel = new \App\Models\User();
            $existing = $userModel->getByEmail($data['email']);
            if ($existing) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Email already registered'
                ]);
                return;
            }

            // Hash password
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);

            // Set default role as 'user' if not specified, and ensure user cannot set sensitive fields
            $data['role'] = 'user';
            unset($data['hwa_id']);
            unset($data['kukkiwon_id']);
            unset($data['club_id']);

            // Create user
            $result = $userModel->create($data);

            if ($result) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'User registered successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to register user'
                ]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/auth/verify - Verify token
     */
    public function verify()
    {
        try {
            $headers = getallheaders();
            $token = $headers['Authorization'] ?? null;

            if (!$token) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No token provided'
                ]);
                return;
            }

            // Remove "Bearer " prefix
            $token = str_replace('Bearer ', '', $token);

            $decoded = $this->verifyToken($token);

            if (!$decoded) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid token'
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'admin' => $decoded
            ]);
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate JWT token
     */
    private function generateToken($admin)
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];

        $payload = [
            'id' => $admin['id'],
            'email' => $admin['email'],
            'name' => $admin['name'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ];

        $secret = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';

        $header_encoded = $this->base64UrlEncode(json_encode($header));
        $payload_encoded = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            "{$header_encoded}.{$payload_encoded}",
            $secret,
            true
        );
        $signature_encoded = $this->base64UrlEncode($signature);

        return "{$header_encoded}.{$payload_encoded}.{$signature_encoded}";
    }

    /**
     * Verify JWT token
     */
    private function verifyToken($token)
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
        $signature_check = $this->base64UrlEncode($signature);

        if ($signature_encoded !== $signature_check) {
            return false;
        }

        $payload = json_decode($this->base64UrlDecode($payload_encoded), true);

        if ($payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Base64 URL encode
     */
    private function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 4 - strlen($data) % 4));
    }
}

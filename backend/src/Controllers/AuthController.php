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
     * POST /api/auth/register - Register new user with email only
     */
    public function register()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Email is required'
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

            // Generate a secure registration token
            $registrationToken = bin2hex(random_bytes(32));

            // Create user with email only (no password yet, unverified)
            $userData = [
                'email' => $data['email'],
                'name' => '', // Empty for now, will be set during confirmation
                'password' => '', // Empty for now, will be set during confirmation
                'role' => 'user',
                'is_verified' => 0,
                'registration_token' => $registrationToken,
                'registration_token_expires' => date('Y-m-d H:i:s', time() + 86400) // 24 hours
            ];

            $result = $userModel->create($userData);

            if ($result) {
                // Send confirmation email
                try {
                    $emailService = new \App\Services\EmailService();
                    $emailService->sendRegistrationConfirmationEmail($data['email'], $registrationToken);
                } catch (\Exception $e) {
                    // If email fails, still return success but log the issue
                    error_log('Failed to send registration email: ' . $e->getMessage());
                }

                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Registration email sent. Please check your email to confirm.'
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
     * POST /api/auth/confirm-registration - Confirm registration and set password
     */
    public function confirmRegistration()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['token']) || !isset($data['name']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Token, name, and password are required'
                ]);
                return;
            }

            $userModel = new \App\Models\User();
            $user = $userModel->getByRegistrationToken($data['token']);

            if (!$user) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid or expired confirmation token'
                ]);
                return;
            }

            // Hash password and update user
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $result = $userModel->confirmRegistration($user['id'], $data['name'], $hashedPassword);

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Registration completed successfully. You can now login.'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to complete registration'
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
     * POST /api/auth/forgot-password - Request password reset
     */
    public function forgotPassword()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Email is required'
                ]);
                return;
            }

            $userModel = new \App\Models\User();
            $user = $userModel->getByEmail($data['email']);

            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }

            // Generate a secure reset token
            $resetToken = bin2hex(random_bytes(32));

            // Store token in database
            $userModel->setPasswordResetToken($data['email'], $resetToken);

            // Send email
            try {
                $emailService = new \App\Services\EmailService();
                $emailService->sendPasswordResetEmail($user['email'], $user['name'], $resetToken);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to send reset email: ' . $e->getMessage()
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Password reset email sent successfully'
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
     * POST /api/auth/reset-password - Reset password with token
     */
    public function resetPassword()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['token']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Token and password are required'
                ]);
                return;
            }

            $userModel = new \App\Models\User();
            $user = $userModel->getByResetToken($data['token']);

            if (!$user) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid or expired reset token'
                ]);
                return;
            }

            // Hash the new password
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

            // Update password and clear reset token
            $result = $userModel->updatePassword($user['id'], $hashedPassword);

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Password reset successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to reset password'
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
            'role' => $admin['role'],
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

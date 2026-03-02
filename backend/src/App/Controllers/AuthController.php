<?php

namespace App\Controllers;

use App\Config\Config;
use App\Models\User;
use App\Services\EmailService;


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

            $userModel = new User();
            $user = $userModel->getByEmail($data['email']);

            if (!$user) {
                error_log("Login failed: User not found for email: " . $data['email']);
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid credentials'
                ]);
                return;
            }

            error_log("Login attempt: User found. Email: " . $user['email'] . ", Verified: " . $user['is_verified']);

            // Verify password
            if (!password_verify($data['password'], $user['password'])) {
                error_log("Login failed: Password mismatch for email: " . $data['email']);
                // Log hash info (safely)
                error_log("Hash length in DB: " . strlen($user['password']));
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

            $email = trim($data['email']);

            // Check if user already exists
            $userModel = new User();
            $existing = $userModel->getByEmail($email);
            
            if ($existing) {
                if ($existing['is_verified']) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Email already registered'
                    ]);
                    return;
                }
                
                // If user exists but is not verified, we can re-send the registration email
                // Generate a new secure registration token
                $registrationToken = bin2hex(random_bytes(32));
                $updateData = [
                    'registration_token' => $registrationToken,
                    'registration_token_expires' => date('Y-m-d H:i:s', time() + 86400) // 24 hours
                ];
                
                $result = $userModel->update($existing['id'], $updateData);
                
                if ($result) {
                    try {
                        $emailService = new EmailService();
                        $emailService->sendRegistrationConfirmationEmail($email, $registrationToken);
                    } catch (\Exception $e) {
                        error_log('Failed to re-send registration email: ' . $e->getMessage());
                    }
                    
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Registration email re-sent. Please check your email to confirm.'
                    ]);
                    return;
                }
            }

            // Generate a secure registration token
            $registrationToken = bin2hex(random_bytes(32));

            // Create user with email only (no password yet, unverified)
            $userData = [
                'email' => $email,
                'name' => '', // Empty for now, will be set during confirmation
                'password' => '', // Empty for now, will be set during confirmation
                'role' => 'user',
                'is_verified' => 0,
                'registration_token' => $registrationToken,
                'registration_token_expires' => date('Y-m-d H:i:s', time() + 86400) // 24 hours
            ];

            error_log("Attempting to register email: " . $email);
            
            $result = $userModel->create($userData);

            if ($result) {
                error_log("Successfully created user record for email: " . $data['email']);
                // Send confirmation email
                try {
                    $emailService = new EmailService();
                    $emailService->sendRegistrationConfirmationEmail($data['email'], $registrationToken);
                    
                    http_response_code(201);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Registration email sent. Please check your email to confirm.'
                    ]);
                } catch (\Exception $e) {
                    // If email fails, return failure to let user know they should try again
                    error_log('Failed to send registration email: ' . $e->getMessage());
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Registration created but failed to send email. Please use Forgot Password to reset and verify.'
                    ]);
                }
            } else {
                error_log("Failed to create user record for email: " . $data['email']);
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

            $userModel = new User();
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

            $userModel = new User();
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
                $emailService = new EmailService();
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

            $userModel = new User();
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

        $secret = Config::get('jwt.secret', 'your-secret-key-change-in-production');

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

        $secret = Config::get('jwt.secret', 'your-secret-key-change-in-production');

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

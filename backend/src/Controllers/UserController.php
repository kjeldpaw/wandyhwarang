<?php

namespace App\Controllers;

use App\Models\User;
use App\Middleware\Auth;

class UserController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * GET /api/users - Get all users
     */
    public function getAll()
    {
        try {
            $users = $this->userModel->getAll();
            echo json_encode([
                'success' => true,
                'data' => $users
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
     * GET /api/users/{id} - Get user by ID
     */
    public function getById($params)
    {
        try {
            $user = $this->userModel->getById($params['id']);
            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }
            echo json_encode([
                'success' => true,
                'data' => $user
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
     * POST /api/users - Create new user (Admin only)
     */
    public function create()
    {
        try {
            // Verify admin authentication
            $admin = Auth::getCurrentAdmin();
            if (!$admin) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Admin authentication required'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['name']) || !isset($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing required fields: name, email'
                ]);
                return;
            }

            $result = $this->userModel->create($data);
            if ($result) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'User created successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to create user'
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
     * PUT /api/users/{id} - Update user (Admin only)
     */
    public function update($params)
    {
        try {
            // Verify admin authentication
            $admin = Auth::getCurrentAdmin();
            if (!$admin) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Admin authentication required'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid request body'
                ]);
                return;
            }

            $result = $this->userModel->update($params['id'], $data);
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'User updated successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to update user'
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
     * DELETE /api/users/{id} - Delete user (Admin only)
     */
    public function delete($params)
    {
        try {
            // Verify admin authentication
            $admin = Auth::getCurrentAdmin();
            if (!$admin) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Admin authentication required'
                ]);
                return;
            }

            $result = $this->userModel->delete($params['id']);
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'User deleted successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to delete user'
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
}
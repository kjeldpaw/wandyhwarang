<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\BeltHistory;
use App\Middleware\Auth;

class UserController
{
    private $userModel;
    private $beltModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->beltModel = new BeltHistory();
    }

    /**
     * GET /api/users - Get all users (Master and Admin only)
     * Masters see users from their club, Admins see all users
     */
    public function getAll()
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!$currentUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Authentication required'
                ]);
                return;
            }

            $role = $currentUser['role'] ?? 'user';

            if ($role === 'user') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Users cannot list all users'
                ]);
                return;
            }

            if ($role === 'master') {
                // Master sees only users from their club
                $users = $this->userModel->getByClubId($currentUser['club_id'] ?? null);
            } else {
                // Admin sees all users
                $users = $this->userModel->getAllWithClub();
            }

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
     * GET /api/users/{id} - Get user by ID with belt history
     * User can only see their own data, Masters see users from their club, Admins see all
     */
    public function getById($params)
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!$currentUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Authentication required'
                ]);
                return;
            }

            $user = $this->userModel->getByIdWithClub($params['id']);

            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }

            // Check authorization
            if ($currentUser['role'] === 'user' && $currentUser['id'] != $params['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only view your own profile'
                ]);
                return;
            }

            if ($currentUser['role'] === 'master' && $user['club_id'] !== $currentUser['club_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only view users from your club'
                ]);
                return;
            }

            // Get belt history
            $beltHistory = $this->beltModel->getByUserId($params['id']);

            echo json_encode([
                'success' => true,
                'data' => $user,
                'beltHistory' => $beltHistory
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
            if (!Auth::isAdmin()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Admin access required'
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

            // Check if email already exists
            $existing = $this->userModel->getByEmail($data['email']);
            if ($existing) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Email already registered'
                ]);
                return;
            }

            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
            }

            // Set role if provided, default to 'user'
            $data['role'] = $data['role'] ?? 'user';

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
     * PUT /api/users/{id} - Update user
     * User can update their own data (except sensitive fields)
     * Master can update users from their club (except club, hwa_id, kukkiwon_id)
     * Admin can update all users
     */
    public function update($params)
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!$currentUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Authentication required'
                ]);
                return;
            }

            $user = $this->userModel->getById($params['id']);

            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }

            // Check authorization
            if ($currentUser['role'] === 'user' && $currentUser['id'] != $params['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only update your own profile'
                ]);
                return;
            }

            if ($currentUser['role'] === 'master' && $user['club_id'] !== $currentUser['club_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only update users from your club'
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

            // Prevent users from updating sensitive fields
            if ($currentUser['role'] === 'user') {
                unset($data['role']);
                unset($data['hwa_id']);
                unset($data['kukkiwon_id']);
                unset($data['club_id']);
            }

            // Prevent masters from changing club or setting sensitive fields
            if ($currentUser['role'] === 'master') {
                unset($data['role']);
                unset($data['hwa_id']);
                unset($data['kukkiwon_id']);
                unset($data['club_id']);
            }

            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
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
            if (!Auth::isAdmin()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Admin access required'
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

    /**
     * GET /api/users/search/{query} - Search users (Master and Admin only)
     */
    public function search($params)
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!$currentUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized: Authentication required'
                ]);
                return;
            }

            if ($currentUser['role'] === 'user') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Users cannot search'
                ]);
                return;
            }

            $results = $this->userModel->search($params['query'] ?? '');

            // Filter results for masters (show only their club)
            if ($currentUser['role'] === 'master') {
                $results = array_filter($results, function($user) use ($currentUser) {
                    return $user['club_id'] === $currentUser['club_id'];
                });
            }

            echo json_encode([
                'success' => true,
                'data' => array_values($results)
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
     * POST /api/users/{id}/belt - Award belt to user (Master and Admin only)
     */
    public function awardBelt($params)
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!Auth::isMaster()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Master or Admin access required'
                ]);
                return;
            }

            $user = $this->userModel->getById($params['id']);

            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }

            // Master can only award belt to users from their club
            if ($currentUser['role'] === 'master' && $user['club_id'] !== $currentUser['club_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only award belt to users from your club'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['belt_level'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Belt level is required'
                ]);
                return;
            }

            $result = $this->beltModel->addBelt($params['id'], $data['belt_level'], $currentUser['id'], $data['awarded_date'] ?? null);

            if ($result) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Belt awarded successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to award belt'
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
     * PUT /api/users/{userId}/belt/{beltId} - Update belt for user (Master and Admin only)
     */
    public function updateBelt($params)
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!Auth::isMaster()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Master or Admin access required'
                ]);
                return;
            }

            $user = $this->userModel->getById($params['userId']);

            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }

            // Master can only update belt for users from their club
            if ($currentUser['role'] === 'master' && $user['club_id'] !== $currentUser['club_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only update belts for users from your club'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['belt_level'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Belt level is required'
                ]);
                return;
            }

            $result = $this->beltModel->update($params['beltId'], [
                'belt_level' => $data['belt_level'],
                'awarded_date' => $data['awarded_date'] ?? null
            ]);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Belt updated successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to update belt'
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
     * DELETE /api/users/{userId}/belt/{beltId} - Delete belt from user (Master and Admin only)
     */
    public function deleteBelt($params)
    {
        try {
            $currentUser = Auth::getCurrentUser();

            if (!Auth::isMaster()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Master or Admin access required'
                ]);
                return;
            }

            $user = $this->userModel->getById($params['userId']);

            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
                return;
            }

            // Master can only delete belt for users from their club
            if ($currentUser['role'] === 'master' && $user['club_id'] !== $currentUser['club_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: You can only delete belts for users from your club'
                ]);
                return;
            }

            $result = $this->beltModel->delete($params['beltId']);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Belt deleted successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to delete belt'
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

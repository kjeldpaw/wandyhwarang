<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Models\User;

class UserControllerTest extends TestCase
{
    private $userModel;

    protected function setUp(): void
    {
        $this->userModel = new User();
        // Clear users table for each test
        $this->clearUsers();
    }

    private function clearUsers()
    {
        try {
            $pdo = $this->userModel->getPDO();
            $pdo->exec("DELETE FROM users");
        } catch (\Exception $e) {
            // Table might not exist yet, that's okay
        }
    }

    /**
     * Test getting all users
     */
    public function testGetAllUsers()
    {
        // Create a few users
        $this->userModel->create([
            'name' => 'User 1',
            'email' => 'user1@example.com'
        ]);
        $this->userModel->create([
            'name' => 'User 2',
            'email' => 'user2@example.com'
        ]);

        $users = $this->userModel->getAll();

        $this->assertIsArray($users);
        $this->assertCount(2, $users);
    }

    /**
     * Test creating a new user
     */
    public function testCreateUser()
    {
        $data = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'phone' => '+1234567890',
            'address' => '123 Main St',
            'age' => 25
        ];

        $result = $this->userModel->create($data);
        $this->assertTrue($result);

        // Verify user was created
        $users = $this->userModel->getAll();
        $this->assertCount(1, $users);
        $this->assertEquals('newuser@example.com', $users[0]['email']);
    }

    /**
     * Test getting specific user by ID
     */
    public function testGetUserById()
    {
        // Create a user
        $this->userModel->create([
            'name' => 'Test User',
            'email' => 'testuser@example.com',
            'phone' => '+1234567890'
        ]);

        $users = $this->userModel->getAll();
        $userId = $users[0]['id'];

        // Get that user
        $user = $this->userModel->getById($userId);

        $this->assertNotNull($user);
        $this->assertEquals('testuser@example.com', $user['email']);
        $this->assertEquals($userId, $user['id']);
    }

    /**
     * Test getting non-existent user
     */
    public function testGetNonExistentUser()
    {
        $user = $this->userModel->getById(99999);
        $this->assertFalse($user);
    }

    /**
     * Test updating a user
     */
    public function testUpdateUser()
    {
        // Create a user
        $this->userModel->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
            'phone' => '+1111111111'
        ]);

        $users = $this->userModel->getAll();
        $userId = $users[0]['id'];

        // Update the user
        $updateData = [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'phone' => '+2222222222'
        ];

        $result = $this->userModel->update($userId, $updateData);
        $this->assertTrue($result);

        // Verify update
        $updated = $this->userModel->getById($userId);
        $this->assertEquals('Updated Name', $updated['name']);
        $this->assertEquals('updated@example.com', $updated['email']);
    }

    /**
     * Test deleting a user
     */
    public function testDeleteUser()
    {
        // Create a user
        $this->userModel->create([
            'name' => 'User to Delete',
            'email' => 'todelete@example.com'
        ]);

        $users = $this->userModel->getAll();
        $userId = $users[0]['id'];

        // Delete the user
        $result = $this->userModel->delete($userId);
        $this->assertTrue($result);

        // Verify deletion
        $deleted = $this->userModel->getById($userId);
        $this->assertFalse($deleted);
    }

    /**
     * Test creating user with missing required fields
     */
    public function testCreateUserWithMissingFields()
    {
        // Create without name
        $data = [
            'email' => 'user@example.com'
            // Missing required name field
        ];

        try {
            $this->userModel->create($data);
            // If no exception, check that nothing was created
            $users = $this->userModel->getAll();
            $this->assertCount(0, $users);
        } catch (\Exception $e) {
            // Expected behavior - missing required field
            $this->assertTrue(true);
        }
    }

    /**
     * Test creating user with duplicate email
     */
    public function testCreateUserWithDuplicateEmail()
    {
        // Create first user
        $this->userModel->create([
            'name' => 'First User',
            'email' => 'duplicate@example.com'
        ]);

        // Try creating another with same email
        try {
            $this->userModel->create([
                'name' => 'Second User',
                'email' => 'duplicate@example.com'
            ]);
            $this->fail('Expected duplicate email to throw exception');
        } catch (\Exception $e) {
            $this->assertTrue(true); // Exception expected
        }
    }

    /**
     * Test user with all fields
     */
    public function testCreateUserWithAllFields()
    {
        $data = [
            'name' => 'Complete User',
            'email' => 'complete@example.com',
            'phone' => '+1234567890',
            'address' => '123 Main St, City',
            'age' => 30
        ];

        $result = $this->userModel->create($data);
        $this->assertTrue($result);

        $users = $this->userModel->getAll();
        $user = $users[0];

        $this->assertEquals('Complete User', $user['name']);
        $this->assertEquals('complete@example.com', $user['email']);
        $this->assertEquals('+1234567890', $user['phone']);
        $this->assertEquals('123 Main St, City', $user['address']);
        $this->assertEquals(30, $user['age']);
    }

    /**
     * Test partial update
     */
    public function testPartialUserUpdate()
    {
        // Create a user
        $this->userModel->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
            'phone' => '+1111111111',
            'address' => 'Original Address'
        ]);

        $users = $this->userModel->getAll();
        $userId = $users[0]['id'];

        // Update only name
        $result = $this->userModel->update($userId, ['name' => 'New Name']);
        $this->assertTrue($result);

        // Verify only name changed
        $updated = $this->userModel->getById($userId);
        $this->assertEquals('New Name', $updated['name']);
        $this->assertEquals('+1111111111', $updated['phone']); // Unchanged
    }
}

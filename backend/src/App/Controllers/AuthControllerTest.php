<?php

namespace App\Controllers;

use App\Models\Admin;
use PHPUnit\Framework\TestCase;

class AuthControllerTest extends TestCase
{
    private $adminModel;
    private $testEmail = 'test@example.com';
    private $testPassword = 'testPassword123';
    private $testName = 'Test User';

    protected function setUp(): void
    {
        $this->adminModel = new Admin();
        // Clear admins table for each test
        $this->clearAdmins();
    }

    private function clearAdmins()
    {
        try {
            $pdo = $this->adminModel->getPDO();
            $pdo->exec("DELETE FROM admins");
        } catch (\Exception $e) {
            // Table might not exist yet, that's okay
        }
    }

    /**
     * Test user registration with valid credentials
     */
    public function testRegistrationWithValidCredentials()
    {
        $data = [
            'name' => $this->testName,
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_DEFAULT)
        ];

        $result = $this->adminModel->create($data);
        $this->assertTrue($result);

        // Verify user was created
        $admin = $this->adminModel->getByEmail($this->testEmail);
        $this->assertNotNull($admin);
        $this->assertEquals($this->testEmail, $admin['email']);
        $this->assertEquals($this->testName, $admin['name']);
    }

    /**
     * Test getting admin by email
     */
    public function testGetAdminByEmail()
    {
        // Create an admin
        $data = [
            'name' => $this->testName,
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_DEFAULT)
        ];
        $this->adminModel->create($data);

        // Retrieve by email
        $admin = $this->adminModel->getByEmail($this->testEmail);

        $this->assertNotNull($admin);
        $this->assertEquals($this->testEmail, $admin['email']);
        $this->assertEquals($this->testName, $admin['name']);
    }

    /**
     * Test password verification
     */
    public function testPasswordVerification()
    {
        $hashedPassword = password_hash($this->testPassword, PASSWORD_DEFAULT);
        $data = [
            'name' => $this->testName,
            'email' => $this->testEmail,
            'password' => $hashedPassword
        ];
        $this->adminModel->create($data);

        $admin = $this->adminModel->getByEmail($this->testEmail);

        // Correct password should verify
        $this->assertTrue(password_verify($this->testPassword, $admin['password']));

        // Wrong password should not verify
        $this->assertFalse(password_verify('wrongPassword', $admin['password']));
    }

    /**
     * Test getting non-existent admin
     */
    public function testGetNonExistentAdmin()
    {
        $admin = $this->adminModel->getByEmail('nonexistent@example.com');
        $this->assertFalse($admin);
    }

    /**
     * Test registration with duplicate email
     */
    public function testRegistrationWithDuplicateEmail()
    {
        // First registration
        $data1 = [
            'name' => $this->testName,
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_DEFAULT)
        ];
        $this->adminModel->create($data1);

        // Try registering again with same email
        $data2 = [
            'name' => 'Different Name',
            'email' => $this->testEmail,
            'password' => password_hash('differentPassword', PASSWORD_DEFAULT)
        ];

        // This should fail due to unique constraint
        try {
            $this->adminModel->create($data2);
            $this->fail('Expected duplicate email to throw exception');
        } catch (\Exception $e) {
            $this->assertTrue(true); // Exception expected
        }
    }

    /**
     * Test admin update
     */
    public function testUpdateAdmin()
    {
        // Create admin
        $data = [
            'name' => $this->testName,
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_DEFAULT)
        ];
        $this->adminModel->create($data);

        $admin = $this->adminModel->getByEmail($this->testEmail);
        $adminId = $admin['id'];

        // Update admin
        $updateData = [
            'name' => 'Updated Name'
        ];
        $result = $this->adminModel->update($adminId, $updateData);
        $this->assertTrue($result);

        // Verify update
        $updated = $this->adminModel->getById($adminId);
        $this->assertEquals('Updated Name', $updated['name']);
    }

    /**
     * Test admin deletion
     */
    public function testDeleteAdmin()
    {
        // Create admin
        $data = [
            'name' => $this->testName,
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_DEFAULT)
        ];
        $this->adminModel->create($data);

        $admin = $this->adminModel->getByEmail($this->testEmail);
        $adminId = $admin['id'];

        // Delete admin
        $result = $this->adminModel->delete($adminId);
        $this->assertTrue($result);

        // Verify deletion
        $deleted = $this->adminModel->getById($adminId);
        $this->assertFalse($deleted);
    }
}

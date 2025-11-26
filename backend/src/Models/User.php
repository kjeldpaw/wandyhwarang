<?php

namespace App\Models;

use App\BaseModel;
use PDO;

class User extends BaseModel
{
    protected $table = 'users';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get user by email
     */
    public function getByEmail($email)
    {
        $query = "SELECT * FROM {$this->table} WHERE email = :email LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get all users with club info
     */
    public function getAllWithClub()
    {
        $query = "SELECT u.*, c.name as club_name
                  FROM {$this->table} u
                  LEFT JOIN clubs c ON u.club_id = c.id
                  ORDER BY u.created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get user with club info by ID
     */
    public function getByIdWithClub($id)
    {
        $query = "SELECT u.*, c.name as club_name
                  FROM {$this->table} u
                  LEFT JOIN clubs c ON u.club_id = c.id
                  WHERE u.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get all users by club
     */
    public function getByClubId($clubId)
    {
        $query = "SELECT * FROM {$this->table} WHERE club_id = :club_id ORDER BY name ASC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':club_id', $clubId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get all masters
     */
    public function getAllMasters()
    {
        $query = "SELECT u.*, c.name as club_name
                  FROM {$this->table} u
                  LEFT JOIN clubs c ON u.club_id = c.id
                  WHERE u.role = 'master'
                  ORDER BY u.name ASC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get all masters of a club
     */
    public function getMastersByClub($clubId)
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE role = 'master' AND club_id = :club_id
                  ORDER BY name ASC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':club_id', $clubId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Search users by name, email, or ID
     */
    public function search($query)
    {
        $searchTerm = "%{$query}%";
        $sql = "SELECT u.*, c.name as club_name
                FROM {$this->table} u
                LEFT JOIN clubs c ON u.club_id = c.id
                WHERE u.name LIKE :search
                   OR u.email LIKE :search
                   OR u.hwa_id LIKE :search
                   OR u.kukkiwon_id LIKE :search
                ORDER BY u.name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':search', $searchTerm);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
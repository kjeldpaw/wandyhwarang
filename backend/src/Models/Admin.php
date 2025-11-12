<?php

namespace App\Models;

use App\BaseModel;
use PDO;

class Admin extends BaseModel
{
    protected $table = 'admins';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get admin by email
     */
    public function getByEmail($email)
    {
        $query = "SELECT * FROM {$this->table} WHERE email = :email LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

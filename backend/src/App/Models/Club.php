<?php

namespace App\Models;

use App\BaseModel;
use PDO;

class Club extends BaseModel
{
    protected $table = 'clubs';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get club by name
     */
    public function getByName($name)
    {
        $query = "SELECT * FROM {$this->table} WHERE name = :name LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':name', $name);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

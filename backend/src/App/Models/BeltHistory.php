<?php

namespace App\Models;

use App\BaseModel;
use PDO;

class BeltHistory extends BaseModel
{
    protected $table = 'belt_history';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get belt history for a user
     */
    public function getByUserId($userId)
    {
        $query = "SELECT bh.*, u.name as awarded_by_name
                  FROM {$this->table} bh
                  LEFT JOIN users u ON bh.awarded_by_master_id = u.id
                  WHERE bh.user_id = :user_id
                  ORDER BY bh.awarded_date DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Add belt to user's history
     */
    public function addBelt($userId, $beltLevel, $awardedByMasterId = null, $awardedDate = null)
    {
        $data = [
            'user_id' => $userId,
            'belt_level' => $beltLevel,
            'awarded_by_master_id' => $awardedByMasterId
        ];
        if ($awardedDate) {
            $data['awarded_date'] = $awardedDate;
        }
        return $this->create($data);
    }

    /**
     * Get latest belt for a user
     */
    public function getLatestBelt($userId)
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE user_id = :user_id
                  ORDER BY awarded_date DESC
                  LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

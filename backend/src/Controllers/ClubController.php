<?php

namespace App\Controllers;

use App\Models\Club;

class ClubController
{
    private $clubModel;

    public function __construct()
    {
        $this->clubModel = new Club();
    }

    /**
     * GET /api/clubs - Get all clubs
     */
    public function getAll()
    {
        try {
            $clubs = $this->clubModel->getAll();

            echo json_encode([
                'success' => true,
                'data' => $clubs
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}

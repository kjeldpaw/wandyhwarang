<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private $host = 'localhost';
    private $db_name = 'wandyhwarang';
    private $user = 'root';
    private $pass = '';
    private $port = 3306;
    private $pdo;

    public function connect()
    {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->pdo = new PDO($dsn, $this->user, $this->pass);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $this->pdo;
        } catch (PDOException $e) {
            echo "Database Connection Error: " . $e->getMessage();
            return null;
        }
    }

    public function getPDO()
    {
        if ($this->pdo === null) {
            $this->connect();
        }
        return $this->pdo;
    }
}
<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private $host;
    private $db_name;
    private $user;
    private $pass;
    private $port;
    private $pdo;

    public function __construct()
    {
        // Try 'database' or 'db' as config keys
        $dbConfig = Config::get('database', Config::get('db', []));

        $this->host = $dbConfig['host'] ?? 'localhost';
        $this->db_name = $dbConfig['name'] ?? 'wandyhwarang';
        $this->user = $dbConfig['user'] ?? 'root';
        $this->pass = $dbConfig['password'] ?? '';
        $this->port = (int)($dbConfig['port'] ?? 3306);
    }

    public function connect()
    {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->pdo = new PDO($dsn, $this->user, $this->pass);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $this->pdo;
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw $e;
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
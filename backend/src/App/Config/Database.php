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
        $this->host = Config::get('database.host', 'localhost');
        $this->db_name = Config::get('database.name', 'wandyhwarang');
        $this->user = Config::get('database.user', 'root');
        $this->pass = Config::get('database.password', '');
        $this->port = Config::get('database.port', 3306);
    }

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
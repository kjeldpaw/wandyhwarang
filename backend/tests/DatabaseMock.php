<?php

namespace App\Config;

use PDO;
use PDOException;

/**
 * Mock Database class for testing
 * Returns an in-memory SQLite database instead of MySQL
 */
class Database
{
    private $pdo;
    private static $testInstance;

    public function __construct()
    {
        // Use test database connection
    }

    public function connect()
    {
        return $this->getPDO();
    }

    public function getPDO()
    {
        if ($this->pdo === null) {
            $this->pdo = self::getTestDatabasePDO();
        }
        return $this->pdo;
    }

    private static function getTestDatabasePDO()
    {
        if (self::$testInstance === null) {
            try {
                // Use SQLite in-memory database for testing
                self::$testInstance = new PDO('sqlite::memory:');
                self::$testInstance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::initializeSchema(self::$testInstance);
            } catch (PDOException $e) {
                throw new Exception('Test database connection failed: ' . $e->getMessage());
            }
        }
        return self::$testInstance;
    }

    private static function initializeSchema($pdo)
    {
        $schemaFile = dirname(dirname(__DIR__)) . '/backend/database/schema.sql';
        if (!file_exists($schemaFile)) {
            self::createBasicSchema($pdo);
            return;
        }

        $schema = file_get_contents($schemaFile);
        // SQLite doesn't support some MySQL syntax, so we need to adapt
        $schema = str_replace('AUTO_INCREMENT', 'AUTOINCREMENT', $schema);
        $schema = str_replace('charset=utf8mb4', '', $schema);

        try {
            $pdo->exec($schema);
        } catch (PDOException $e) {
            // If schema fails, create basic tables
            self::createBasicSchema($pdo);
        }
    }

    private static function createBasicSchema($pdo)
    {
        $sql = <<<SQL
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            address TEXT,
            age INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        SQL;

        $pdo->exec($sql);
    }

    public static function reset()
    {
        self::$testInstance = null;
    }
}

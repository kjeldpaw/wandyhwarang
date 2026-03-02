<?php

namespace App;

use App\Config\Database;
use PDO;

abstract class BaseModel
{
    protected $db;
    protected $table;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getPDO();
    }

    /**
     * Get PDO connection (useful for testing)
     */
    public function getPDO()
    {
        return $this->db;
    }

    /**
     * Get all records
     */
    public function getAll()
    {
        $query = "SELECT * FROM {$this->table}";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get record by ID
     */
    public function getById($id)
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Create new record
     */
    public function create($data)
    {
        $columns = implode(', ', array_keys($data));
        $values = implode(', ', array_fill(0, count($data), '?'));
        $query = "INSERT INTO {$this->table} ({$columns}) VALUES ({$values})";

        try {
            $stmt = $this->db->prepare($query);
            $result = $stmt->execute(array_values($data));
            if (!$result) {
                error_log("SQL Error (create) in {$this->table}: " . implode(", ", $stmt->errorInfo()));
            }
            return $result;
        } catch (\PDOException $e) {
            error_log("PDO Exception (create) in {$this->table}: " . $e->getMessage());
            error_log("Query: $query");
            error_log("Params: " . json_encode(array_values($data)));
            throw $e;
        }
    }

    /**
     * Update record
     */
    public function update($id, $data)
    {
        $setClause = implode(', ', array_map(function ($key) {
            return "{$key} = ?";
        }, array_keys($data)));

        $query = "UPDATE {$this->table} SET {$setClause} WHERE id = ?";
        $values = array_values($data);
        $values[] = $id;

        try {
            $stmt = $this->db->prepare($query);
            $result = $stmt->execute($values);
            if (!$result) {
                error_log("SQL Error (update) in {$this->table}: " . implode(", ", $stmt->errorInfo()));
            }
            return $result;
        } catch (\PDOException $e) {
            error_log("PDO Exception (update) in {$this->table}: " . $e->getMessage());
            error_log("Query: $query");
            error_log("Params: " . json_encode($values));
            throw $e;
        }
    }

    /**
     * Delete record
     */
    public function delete($id)
    {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
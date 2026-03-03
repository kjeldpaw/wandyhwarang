<?php

namespace App\Config;

class Config
{
    private static $config = null;

    public static function get($key, $default = null)
    {
        if (self::$config === null) {
            self::load();
        }

        $parts = explode('.', $key);
        $value = self::$config;

        foreach ($parts as $part) {
            if (isset($value[$part])) {
                $value = $value[$part];
            } else {
                return $default;
            }
        }

        return $value;
    }

    private static function load()
    {
        // Try multiple locations to find config.php
        $possiblePaths = [
            __DIR__ . '/../../config.php',       // Standard: App/Config/../../config.php
            __DIR__ . '/../../../config.php',    // Root: App/Config/../../../config.php
            dirname(dirname(dirname(__DIR__))) . '/config.php', // Project root
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                self::$config = require $path;
                return;
            }
        }

        error_log("Config file NOT FOUND in any expected location: " . implode(", ", $possiblePaths));
        self::$config = [];
    }
}

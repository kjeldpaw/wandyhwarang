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
        $configPath = __DIR__ . '/../../config.php';
        if (file_exists($configPath)) {
            self::$config = require $configPath;
        } else {
            self::$config = [];
        }
    }
}

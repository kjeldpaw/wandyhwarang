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
                return self::getFromEnv($key, $default);
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

    private static function getFromEnv($key, $default)
    {
        // Fallback to env variables if property file doesn't have it
        // Mapping from dot notation to ENV names
        $map = [
            'database.host' => 'DB_HOST',
            'database.port' => 'DB_PORT',
            'database.name' => 'DB_NAME',
            'database.user' => 'DB_USER',
            'database.password' => 'DB_PASSWORD',
            'jwt.secret' => 'JWT_SECRET',
            'mail.host' => 'MAIL_HOST',
            'mail.port' => 'MAIL_PORT',
            'mail.username' => 'MAIL_USERNAME',
            'mail.password' => 'MAIL_PASSWORD',
            'mail.from_address' => 'MAIL_FROM_ADDRESS',
            'mail.from_name' => 'MAIL_FROM_NAME',
            'app.url' => 'API_URL',
            'app.frontend_url' => 'FRONTEND_URL',
            'app.src_dir' => 'APP_SRC_DIR',
        ];

        if (isset($map[$key])) {
            $envValue = getenv($map[$key]);
            if ($envValue !== false) {
                return $envValue;
            }
        }

        return $default;
    }
}

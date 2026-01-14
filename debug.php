<?php
/**
 * DEBUG HELPER - Upload this to your server to diagnose issues
 * Access via: https://wandywharang.dk/debug.php
 * DELETE THIS FILE after troubleshooting!
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Wandyhwarang Debug Information</h1>";
echo "<pre>";

// 1. PHP Version
echo "\n=== PHP Version ===\n";
echo "PHP Version: " . phpversion() . "\n";

// 2. Current Directory
echo "\n=== Directory Information ===\n";
echo "Current Directory: " . __DIR__ . "\n";
echo "Script Path: " . __FILE__ . "\n";

// 3. Check if files exist
echo "\n=== File Existence Check ===\n";
$files_to_check = [
    'index.php',
    'index.html',
    'config.php',
    'config.php.example',
    'src/Config/Config.php',
    'src/Router.php',
    'src/Controllers/AuthController.php',
    'database/schema.sql',
    'vendor/autoload.php',
];

foreach ($files_to_check as $file) {
    $path = __DIR__ . '/' . $file;
    $exists = file_exists($path) ? '✓ EXISTS' : '✗ MISSING';
    $readable = is_readable($path) ? '(readable)' : '(not readable)';
    echo "$exists $readable - $file\n";
}

// 4. Directory Contents
echo "\n=== Directory Contents ===\n";
$items = scandir(__DIR__);
foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;
    $type = is_dir(__DIR__ . '/' . $item) ? '[DIR] ' : '[FILE]';
    echo "$type $item\n";
}

// 5. Try to load config
echo "\n=== Config File Test ===\n";
$config_path = __DIR__ . '/config.php';
if (file_exists($config_path)) {
    try {
        $config = require $config_path;
        echo "✓ Config file loaded successfully\n";
        echo "Config keys: " . implode(', ', array_keys($config)) . "\n";

        // Don't show sensitive data, just check structure
        if (isset($config['database'])) {
            echo "✓ Database config exists\n";
            echo "  - Host: " . ($config['database']['host'] ?? 'NOT SET') . "\n";
            echo "  - Database: " . ($config['database']['name'] ?? 'NOT SET') . "\n";
            echo "  - User: " . ($config['database']['user'] ?? 'NOT SET') . "\n";
        }

        if (isset($config['app'])) {
            echo "✓ App config exists\n";
            echo "  - URL: " . ($config['app']['url'] ?? 'NOT SET') . "\n";
            echo "  - src_dir: " . ($config['app']['src_dir'] ?? 'NOT SET') . "\n";
        }
    } catch (Exception $e) {
        echo "✗ Error loading config: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ config.php NOT FOUND - You need to create it from config.php.example\n";
}

// 6. Try to load Config class
echo "\n=== Config Class Test ===\n";
$config_class_path = __DIR__ . '/src/Config/Config.php';
if (file_exists($config_class_path)) {
    try {
        require_once $config_class_path;
        echo "✓ Config class loaded successfully\n";

        // Try to use it
        $test_value = \App\Config\Config::get('app.url', 'DEFAULT');
        echo "✓ Config::get() works: app.url = $test_value\n";
    } catch (Exception $e) {
        echo "✗ Error loading Config class: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ src/Config/Config.php NOT FOUND\n";
}

// 7. Database connection test
echo "\n=== Database Connection Test ===\n";
if (file_exists($config_path)) {
    $config = require $config_path;
    try {
        $dsn = "mysql:host={$config['database']['host']};port={$config['database']['port']};dbname={$config['database']['name']}";
        $pdo = new PDO($dsn, $config['database']['user'], $config['database']['password']);
        echo "✓ Database connection successful!\n";
        echo "  Connected to: {$config['database']['name']}\n";
    } catch (PDOException $e) {
        echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    }
}

// 8. PHP Extensions
echo "\n=== PHP Extensions ===\n";
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($required_extensions as $ext) {
    $loaded = extension_loaded($ext) ? '✓' : '✗';
    echo "$loaded $ext\n";
}

echo "\n=== End of Debug Information ===\n";
echo "\n⚠️  IMPORTANT: Delete this file after troubleshooting!\n";
echo "</pre>";

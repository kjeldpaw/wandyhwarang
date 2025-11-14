<?php

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Define project root
define('PROJECT_ROOT', dirname(__DIR__));

// Load autoloader
require PROJECT_ROOT . '/vendor/autoload.php';

// Load the mock Database class for testing
require PROJECT_ROOT . '/tests/DatabaseMock.php';

// Set up environment variables for testing
putenv('DB_HOST=localhost');
putenv('DB_PORT=3306');
putenv('DB_NAME=wandyhwarang_test');
putenv('DB_USER=root');
putenv('DB_PASSWORD=');
putenv('JWT_SECRET=test-secret-key');

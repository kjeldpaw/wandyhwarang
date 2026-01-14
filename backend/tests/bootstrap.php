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

// Set up the app for testing
require_once PROJECT_ROOT . '/src/Config/Config.php';

// The Config class will load backend/config.php automatically.
// We should ensure tests don't rely on environment variables.

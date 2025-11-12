<?php

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include autoloader (manual PSR-4 autoloading)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use App\Router;
use App\Controllers\UserController;

// Initialize router
$router = new Router();

// User routes
$userController = new UserController();

$router->get('/api/users', function() use ($userController) {
    return $userController->getAll();
});

$router->get('/api/users/{id}', function($params) use ($userController) {
    return $userController->getById($params);
});

$router->post('/api/users', function() use ($userController) {
    return $userController->create();
});

$router->put('/api/users/{id}', function($params) use ($userController) {
    return $userController->update($params);
});

$router->delete('/api/users/{id}', function($params) use ($userController) {
    return $userController->delete($params);
});

// Dispatch the request
$router->dispatch();
<?php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If it's not an API request, serve the React app (index.html)
if (!preg_match('#^/api(/|$)#', $uri)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    exit();
}

// Enable CORS for API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include autoloader (manual PSR-4 autoloading)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);

    // Try src directory first
    $base_dir = __DIR__ . '/../src/';
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
        return;
    }

    // Try config directory
    $base_dir = __DIR__ . '/../config/';
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
        return;
    }
});

use App\Router;
use App\Controllers\UserController;
use App\Controllers\AuthController;

// Initialize router
$router = new Router();

// Auth routes
$authController = new AuthController();

$router->post('/api/auth/login', function() use ($authController) {
    return $authController->login();
});

$router->post('/api/auth/register', function() use ($authController) {
    return $authController->register();
});

$router->post('/api/auth/verify', function() use ($authController) {
    return $authController->verify();
});

$router->post('/api/auth/forgot-password', function() use ($authController) {
    return $authController->forgotPassword();
});

$router->post('/api/auth/reset-password', function() use ($authController) {
    return $authController->resetPassword();
});

$router->post('/api/auth/confirm-registration', function() use ($authController) {
    return $authController->confirmRegistration();
});

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

$router->get('/api/users/search/{query}', function($params) use ($userController) {
    return $userController->search($params);
});

$router->post('/api/users/{id}/belt', function($params) use ($userController) {
    return $userController->awardBelt($params);
});

$router->put('/api/users/{userId}/belt/{beltId}', function($params) use ($userController) {
    return $userController->updateBelt($params);
});

$router->delete('/api/users/{userId}/belt/{beltId}', function($params) use ($userController) {
    return $userController->deleteBelt($params);
});

// Club routes
$clubController = new \App\Controllers\ClubController();

$router->get('/api/clubs', function() use ($clubController) {
    return $clubController->getAll();
});

// Dispatch the request
$router->dispatch();
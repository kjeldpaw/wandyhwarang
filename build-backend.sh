#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define project directories
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
BUILD_DIR="${BACKEND_DIR}/build"

echo "Building backend..."

# Check if PHP and Composer are installed
if ! command -v php &> /dev/null; then
    echo "Error: php is not installed."
    exit 1
fi

if ! command -v composer &> /dev/null; then
    echo "Error: composer is not installed."
    exit 1
fi

# Navigate to backend directory
cd "${BACKEND_DIR}"

# Create/clean build directory
echo "Preparing build directory: ${BUILD_DIR}"
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Install dependencies (production-ready)
echo "Installing dependencies using composer install --no-dev --optimize-autoloader..."
composer install --no-dev --optimize-autoloader

# Copy relevant files to build directory
echo "Copying backend files to build directory..."

# Core backend components
if [ -d "src" ]; then
    cp -r src/* "${BUILD_DIR}/"
fi

if [ -d "vendor" ]; then
    cp -r vendor "${BUILD_DIR}/"
fi

# Supporting files
[ -f "composer.json" ] && cp "composer.json" "${BUILD_DIR}/"
[ -f "composer.lock" ] && cp "composer.lock" "${BUILD_DIR}/"

echo "Backend build completed successfully."
echo "Build artifacts are located in ${BUILD_DIR}"

# Restore development dependencies for the working directory
echo "Restoring development dependencies..."
composer install

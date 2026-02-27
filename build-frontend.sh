#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define project directories
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

echo "Building frontend..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm."
    exit 1
fi

# Navigate to frontend directory
cd "${FRONTEND_DIR}"

# Install dependencies
echo "Installing dependencies using npm install..."
npm install

# Run build script
echo "Running npm run build..."
npm run build

echo "Frontend build completed successfully."
echo "Build artifacts are located in ${FRONTEND_DIR}/build"

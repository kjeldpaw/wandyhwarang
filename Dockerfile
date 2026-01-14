# Multi-stage build: First build React app
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm install

COPY frontend .

# Build React app for production
RUN npm run build

# Main stage: PHP with both React and API
FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy React build files first
COPY --from=frontend-builder /app/frontend/build ./public

# Copy PHP backend (this will add index.php to the public directory)
COPY backend/public ./public
COPY backend/src ./src
COPY backend/database ./database
COPY backend/composer.json ./
COPY backend/composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Configure Apache
RUN a2enmod rewrite
RUN a2enmod headers
RUN a2enmod proxy
RUN a2enmod proxy_fcgi

# Create Apache VirtualHost configuration
RUN cat > /etc/apache2/sites-available/000-default.conf <<'APACHE_CONFIG'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html/public

    <Directory /var/www/html/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        # Don't rewrite requests for actual files/directories
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        # Rewrite everything else to index.php (for API routing)
        RewriteRule ^ index.php [L]
    </Directory>

    # Static files for React app - serve directly
    <Directory /var/www/html/public/app>
        RewriteEngine Off
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
APACHE_CONFIG

# Expose port
EXPOSE 80

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start Apache
CMD ["apache2-foreground"]

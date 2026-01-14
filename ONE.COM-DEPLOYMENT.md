# Deployment Guide for one.com

This guide covers deploying Wandyhwarang to one.com hosting.

## Prerequisites

Before you begin, make sure you have:
- Access to one.com control panel
- MySQL database created on one.com
- FTP or File Manager access
- PHP 8.0 or higher enabled

## Step-by-Step Deployment

### 1. Build Production Package

On your local machine:

```bash
make prod
```

This creates `dist/wandyhwarang-prod.zip` with the correct `/webroots` folder structure.

### 2. Prepare Database on one.com

1. Log in to one.com control panel
2. Go to **MySQL Databases**
3. Create a new database (or use existing):
   - Database name: `wandyhwarang` (or your choice)
   - Username: Create a database user
   - Password: Set a strong password
4. **Important**: Note down these credentials

### 3. Upload Files

#### Option A: Using File Manager
1. Extract `wandyhwarang-prod.zip` locally
2. Log in to one.com File Manager
3. Navigate to your website's root directory (usually `/www` or `/public_html`)
4. Upload the entire contents of the `webroots/` folder to this directory

#### Option B: Using FTP
1. Extract `wandyhwarang-prod.zip` locally
2. Connect via FTP to one.com
3. Navigate to `/www` or `/public_html`
4. Upload all files from `webroots/` folder

**After upload, your directory should look like:**
```
/www/  (or /public_html/)
├── index.html
├── index.php
├── config.php.example
├── static/
├── src/
├── database/
├── vendor/
└── composer files
```

### 4. Create config.php

**CRITICAL STEP**: You must create `config.php` from the example file.

1. Copy `config.php.example` to `config.php`
2. Edit `config.php` with your production settings:

```php
<?php

return [
    'database' => [
        'host' => 'localhost',  // Usually 'localhost' on one.com
        'port' => 3306,
        'name' => 'your_db_name',      // From step 2
        'user' => 'your_db_user',      // From step 2
        'password' => 'your_db_pass',  // From step 2
    ],
    'jwt' => [
        // Generate a random string (32+ characters)
        'secret' => 'your-random-secret-key-here',
    ],
    'mail' => [
        'host' => 'send.one.com',
        'port' => 465,
        'username' => 'noreply@wandyhwarang.dk',  // Your email
        'password' => 'your-email-password',       // Email password
        'from_address' => 'noreply@wandyhwarang.dk',
        'from_name' => 'Wandy Hwa Rang',
    ],
    'app' => [
        'url' => 'https://wandywharang.dk',
        'frontend_url' => 'https://wandywharang.dk',
        'src_dir' => __DIR__ . '/src/',  // DO NOT change this
    ]
];
```

### 5. Import Database Schema

1. Log in to phpMyAdmin on one.com
2. Select your database
3. Go to **Import** tab
4. Upload `database/schema.sql`
5. Click **Go** to import

### 6. Set File Permissions

If you have SSH access or File Manager with permission settings:

```bash
# All files readable
chmod 644 index.php config.php
chmod 644 -R src/
chmod 644 -R vendor/

# Directories executable
chmod 755 src/
chmod 755 vendor/
chmod 755 database/
```

Most likely one.com sets these automatically.

### 7. Test Your Site

Visit `https://wandywharang.dk`

- You should see the login page
- Try logging in (if you have a test user)

## Troubleshooting 500 Internal Server Error

If you get a 500 error, follow these steps:

### Step 1: Upload Debug Script

1. Upload the `debug.php` file (included in your project) to your server root
2. Visit `https://wandywharang.dk/debug.php` in your browser
3. This will show you exactly what's wrong

### Step 2: Check Common Issues

#### Problem: "config.php NOT FOUND"
**Solution**: You forgot to create `config.php` from `config.php.example`

```bash
# On the server, copy the example file
cp config.php.example config.php
# Then edit it with your database credentials
```

#### Problem: "Database connection failed"
**Solution**: Wrong database credentials in `config.php`

- Verify database host (usually `localhost` on one.com)
- Check database name matches what you created
- Verify username and password are correct

#### Problem: "src/Config/Config.php NOT FOUND"
**Solution**: Files weren't uploaded correctly

- Re-upload all files from the `webroots/` folder
- Make sure the `src/` directory exists
- Check file permissions

#### Problem: "PHP Version too old"
**Solution**: Enable PHP 8.0+ in one.com control panel

1. Go to one.com control panel
2. Find **PHP Settings** or **PHP Version**
3. Select PHP 8.0 or 8.1
4. Save and restart

### Step 3: Enable Error Display (Temporary)

Add this to the TOP of `index.php` temporarily:

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

Visit your site again - you'll see the actual error message.

**IMPORTANT**: Remove these lines after fixing!

### Step 4: Check Error Logs

On one.com:
1. Control Panel → **Logs**
2. Look at **Error Logs**
3. Find recent errors related to your domain

### Step 5: Verify File Structure

Your uploaded files should look like:

```
/www/
├── index.php          ✓ Must exist
├── index.html         ✓ Must exist
├── config.php         ✓ Must exist (NOT .example)
├── asset-manifest.json
├── composer.json
├── composer.lock
├── src/               ✓ Must be a directory
│   ├── Config/
│   ├── Controllers/
│   ├── Models/
│   └── ...
├── static/            ✓ React files
│   ├── js/
│   └── css/
├── database/
│   └── schema.sql
└── vendor/            ✓ PHP dependencies
    └── autoload.php
```

## Common one.com Specific Issues

### 1. .htaccess File

one.com might need an `.htaccess` file for URL rewriting. Create this in your root:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Rewrite everything else to index.php
    RewriteRule ^ index.php [L]
</IfModule>

# Enable PHP error logging
php_flag display_errors off
php_flag log_errors on
```

### 2. Database Host

On one.com, the database host might not be `localhost`. Check your database settings in the control panel. It could be:
- `localhost`
- `mysql.one.com`
- A specific host like `dbXXX.one.com`

### 3. File Upload Limits

If you're getting issues with composer or vendor folder:
- one.com has file count limits
- Upload the entire `vendor/` folder (already included in the zip)
- Don't try to run `composer install` on the server

### 4. PHP Configuration

Make sure these PHP extensions are enabled (usually they are by default):
- PDO
- pdo_mysql
- json
- mbstring

## Security Checklist

Before going live:

- [ ] Change JWT secret to a random 32+ character string
- [ ] Set strong database password
- [ ] Remove or protect `debug.php` (DELETE IT!)
- [ ] Disable error display in production
- [ ] Test all functionality (login, registration, etc.)
- [ ] Enable HTTPS (should be automatic on one.com)
- [ ] Set up regular database backups

## Still Having Issues?

1. **Check debug.php output** - Upload and access it at `https://wandywharang.dk/debug.php`
2. **Review error logs** - Check one.com control panel error logs
3. **Verify all files uploaded** - Re-upload if necessary
4. **Double-check config.php** - Most errors are here
5. **Contact one.com support** - They can check server-side issues

## After Successful Deployment

1. **Delete debug.php** from your server
2. Remove any error display code from index.php
3. Set up automated backups
4. Monitor error logs regularly
5. Test all features thoroughly

---

**Need help?** Check the main DEPLOYMENT.md file for more general deployment guidance.

-- Create database
CREATE DATABASE IF NOT EXISTS wandyhwarang;
USE wandyhwarang;

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table with all required fields
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    address VARCHAR(500),
    phone VARCHAR(20),
    club_id INT,
    hwa_id VARCHAR(50),
    kukkiwon_id VARCHAR(50),
    role ENUM('user', 'master', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
);

-- Create index on email for faster lookups
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_club_id ON users(club_id);
CREATE INDEX idx_role ON users(role);

-- Create belt_history table for tracking belt progression
CREATE TABLE IF NOT EXISTS belt_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    belt_level VARCHAR(50) NOT NULL,
    awarded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_by_master_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by_master_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_belt_user_id ON belt_history(user_id);
CREATE INDEX idx_belt_master_id ON belt_history(awarded_by_master_id);

-- Insert default clubs
INSERT IGNORE INTO clubs (name) VALUES
('Randers Taekwondo Klub'),
('Midtdjurs Taekwondo Klub'),
('Hwa Rang Aarhus');,
('Nordjysk Taekwondo Center');

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Administrator', 'admin@example.com', '$2y$12$AJl.d2/byLRklqpNm9OQPeyNer4C5EjXRi5d89lOFXC4v7sRh2G66', 'admin');

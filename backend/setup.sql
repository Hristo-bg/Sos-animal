CREATE DATABASE IF NOT EXISTS roadguardian CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE roadguardian;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('guest', 'reporter', 'admin') DEFAULT 'reporter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    status ENUM('deceased', 'wounded', 'handled') DEFAULT 'deceased',
    species VARCHAR(100),
    photo_url VARCHAR(255),
    reporter_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Създаване на начален администратор (парола: admin123)
INSERT IGNORE INTO users (email, password, role) VALUES ('admin@puten-pazitel.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

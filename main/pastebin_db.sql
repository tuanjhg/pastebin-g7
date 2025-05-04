CREATE DATABASE IF NOT EXISTS pastebin;
USE pastebin;

DROP TABLE IF EXISTS paste;

CREATE TABLE paste (
  id VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  title VARCHAR(255) DEFAULT 'Untitled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  views INT DEFAULT 0,
  privacy ENUM('PUBLIC','PRIVATE') DEFAULT 'PUBLIC',
  created_month CHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(created_at, '%Y-%m')) STORED,
  PRIMARY KEY (id),
  
  -- 📌 Các index bổ sung:
  INDEX idx_privacy_expires (privacy, expires_at),
  INDEX idx_created_at (created_at),
  INDEX idx_created_month (created_month),
  INDEX idx_expires_at (expires_at)
);

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

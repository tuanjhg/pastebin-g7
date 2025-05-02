CREATE DATABASE IF NOT EXISTS pastebin;
USE pastebin;

DROP TABLE IF EXISTS paste;

CREATE TABLE paste (
  id varchar(10) NOT NULL,
  content text NOT NULL,
  title varchar(255) DEFAULT 'Untitled',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  expires_at datetime DEFAULT NULL,
  views int DEFAULT 0,
  privacy enum('PUBLIC','PRIVATE') DEFAULT 'PUBLIC',
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

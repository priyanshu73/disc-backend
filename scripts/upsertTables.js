import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

async function upsertTables() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    // Create patternTable
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS patternTable (
        segno INT NOT NULL PRIMARY KEY,
        pid CHAR(2)
      )
    `);

    // Create pattern
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pattern (
        pid CHAR(2) PRIMARY KEY,
        pname VARCHAR(20) NOT NULL
      )
    `);

    // Create adjectives
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS adjectives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_number INT NOT NULL,
        text VARCHAR(100) NOT NULL,
        most_shape ENUM('S', 'Z', '*', 'T', 'N') NOT NULL,
        least_shape ENUM('S', 'Z', '*', 'T', 'N') NOT NULL,
        INDEX idx_question_number (question_number)
      )
    `);

    // Create class table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS class (
        class_id INT AUTO_INCREMENT PRIMARY KEY,
        class_year INT NOT NULL,
        semester ENUM('S', 'F') NOT NULL,
        instructor VARCHAR(100) NOT NULL
      )
    `);

    // Create users table (normalized)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(50) NOT NULL,
        lastname VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        class_id INT NOT NULL,
        hasReset BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (class_id) REFERENCES class(class_id)
      )
    `);

    // Create ClassicProfilePatterns table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ClassicProfilePatterns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pid VARCHAR(2) NOT NULL,
        emotions TEXT,
        goal TEXT,
        judges_others_by TEXT,
        influences_others_by TEXT,
        value_to_organization TEXT,
        overuses TEXT,
        under_pressure TEXT,
        fears TEXT,
        would_increase_effectiveness_through TEXT,
        general_description TEXT NOT NULL,
        FOREIGN KEY (pid) REFERENCES pattern(pid) ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Insert two classes for 2025 (S and F) with random instructor names
    // Removed from upsertTables.js as per new structure

    console.log('Tables upserted successfully.');
  } catch (err) {
    console.error('Error upserting tables:', err.message);
  } finally {
    await connection.end();
  }
}

upsertTables(); 
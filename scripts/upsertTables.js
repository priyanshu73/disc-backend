import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

async function upsertTables() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    // Create patternTable
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS patternTable (
        segno INT NOT NULL PRIMARY KEY,
        pid CHAR(2),
        FOREIGN KEY (pid) REFERENCES pattern(pid)
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

 

    // Create users table (normalized)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(50) NOT NULL,
        lastname VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        hasReset BOOLEAN NOT NULL DEFAULT FALSE,
        is_instructor BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

       // Create class table
       await connection.execute(`
        CREATE TABLE IF NOT EXISTS class (
          class_id INT AUTO_INCREMENT PRIMARY KEY,
          class_year INT NOT NULL,
          semester ENUM('S', 'F') NOT NULL
        )
      `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS class_students (
        class_id INT NOT NULL,
        student_id INT NOT NULL,
        instructor_id INT NOT NULL,
        FOREIGN KEY (class_id) REFERENCES class(class_id),
        FOREIGN KEY (student_id) REFERENCES users(user_id),
        FOREIGN KEY (instructor_id) REFERENCES users(user_id)
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

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        classic_profile_pattern_id INT NOT NULL,
        most_counts JSON NOT NULL,
        least_counts JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (classic_profile_pattern_id) REFERENCES ClassicProfilePatterns(id)
      )
    `);

    console.log('Tables upserted successfully.');
  } catch (err) {
    console.error('Error upserting tables:', err.message);
  } finally {
    await connection.end();
  }
}

upsertTables(); 
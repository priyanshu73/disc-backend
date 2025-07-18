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

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(50) NOT NULL,
        lastname VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        class_year INT NOT NULL,
        semester ENUM('SPRING', 'FALL') NOT NULL,
        hasReset BOOLEAN NOT NULL DEFAULT FALSE
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
import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function populateUsers() {
  const connection = await mysql.createConnection(dbConfig);
  const csvPath = path.join(__dirname, 'dummy_users.csv');

  // 1. Insert two classes (2025 S, 2025 F) with fixed IDs 1 and 2
  await connection.execute(
    `INSERT INTO class (class_id, class_year, semester, instructor_id) VALUES (1, 2025, 'S', 1) ON DUPLICATE KEY UPDATE class_id=class_id`
  );
  await connection.execute(
    `INSERT INTO class (class_id, class_year, semester, instructor_id) VALUES (2, 2025, 'F', 2) ON DUPLICATE KEY UPDATE class_id=class_id`
  );

  // 2. Insert two instructors (auto-increment user_id)
  const instructors = [
    { firstname: 'Alice', lastname: 'Smith', username: 'alicesmith', class_id: 1 },
    { firstname: 'Bob', lastname: 'Johnson', username: 'bobjohnson', class_id: 2 }
  ];
  const plainPassword = 'gettysburg2025';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const instructorIds = {}; // Map class_id to instructor user_id

  for (const inst of instructors) {
    const [result] = await connection.execute(
      `INSERT INTO users (firstname, lastname, username, password, hasReset)
       VALUES (?, ?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE user_id=LAST_INSERT_ID(user_id)`,
      [inst.firstname, inst.lastname, inst.username, hashedPassword]
    );
    instructorIds[inst.class_id] = result.insertId;
    
    // Add instructor to instructors table
    await connection.execute(
      `INSERT INTO instructors (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id`,
      [result.insertId]
    );
  }

  // 3. Insert all students from CSV
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    console.error('CSV does not contain enough lines.');
    return;
  }
  const numUsers = parseInt(lines[0], 10);
  if (isNaN(numUsers) || numUsers <= 0) {
    console.error('First line of CSV must be a positive integer (number of users).');
    return;
  }
  const studentIds = [];
  for (let i = 1; i <= numUsers && i < lines.length; i++) {
    const line = lines[i];
    const [firstname, lastname, username, classNum] = line.split(',').map(s => s && s.trim());
    if (!firstname || !lastname || !username || !classNum) {
      console.warn('Skipping row due to missing data:', line);
      continue;
    }
    try {
      const [result] = await connection.execute(
        `INSERT INTO users (firstname, lastname, username, password, hasReset)
         VALUES (?, ?, ?, ?, FALSE)
         ON DUPLICATE KEY UPDATE user_id=LAST_INSERT_ID(user_id)`,
        [firstname, lastname, username, hashedPassword]
      );
      studentIds.push({ user_id: result.insertId, class_id: parseInt(classNum, 10) });
    } catch (err) {
      console.error(`Error inserting user ${username}:`, err.message);
      continue;
    }
  }

  // 4. Populate class_students (link students to classes)
  for (const student of studentIds) {
    try {
      await connection.execute(
        `INSERT INTO class_students (class_id, student_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE class_id=class_id`,
        [student.class_id, student.user_id]
      );
      console.log(`Linked student ${student.user_id} to class ${student.class_id}`);
    } catch (err) {
      console.error(`Error linking student ${student.user_id} to class:`, err.message);
    }
  }
  await connection.end();
  console.log('User and class population complete.');
}

populateUsers(); 
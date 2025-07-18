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

  // Hash the default password once
  const plainPassword = 'gettysburg2025';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Read file as text
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    console.error('CSV does not contain enough lines.');
    return;
  }

  // First line: number of users
  const numUsers = parseInt(lines[0], 10);
  if (isNaN(numUsers) || numUsers <= 0) {
    console.error('First line of CSV must be a positive integer (number of users).');
    return;
  }

  // Process each user line
  for (let i = 1; i <= numUsers && i < lines.length; i++) {
    const line = lines[i];
    const [firstname, lastname, username, class_year, semester] = line.split(',').map(s => s && s.trim());
    if (!firstname || !lastname || !username || !class_year || !semester) {
      console.warn('Skipping row due to missing data:', line);
      continue;
    }
    const password = hashedPassword;
    const hasReset = false;
    try {
      await connection.execute(
        `INSERT INTO users (firstname, lastname, username, password, class_year, semester, hasReset)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [firstname, lastname, username, password, class_year, semester, hasReset]
      );
      console.log(`Inserted user: ${username}`);
    } catch (err) {
      console.error(`Error inserting user ${username}:`, err.message);
    }
  }

  await connection.end();
  console.log('User population complete.');
}

populateUsers(); 
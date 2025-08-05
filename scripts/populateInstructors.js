import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import bcrypt from 'bcryptjs';

async function populateInstructors() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Define instructors
    const instructors = [
      { firstname: 'Sunghee', lastname: ' Kim', username: 'sungheekim' },
      { firstname: 'Ivaylo', lastname: 'Illinkin', username: 'ivayloillinkin' }
    ];

    const plainPassword = 'gettysburg2025';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    console.log('Creating instructors...');

    for (const instructor of instructors) {
      try {
        // Check if username already exists
        const [existingUser] = await connection.execute(
          'SELECT user_id FROM users WHERE username = ?',
          [instructor.username]
        );

        if (existingUser.length > 0) {
          console.log(`Instructor ${instructor.username} already exists, skipping...`);
          continue;
        }

        // Insert user
        const [userResult] = await connection.execute(
          `INSERT INTO users (firstname, lastname, username, password, hasReset)
           VALUES (?, ?, ?, ?, FALSE)`,
          [instructor.firstname, instructor.lastname, instructor.username, hashedPassword]
        );

        const userId = userResult.insertId;

        // Add to instructors table
        await connection.execute(
          'INSERT INTO instructors (user_id) VALUES (?)',
          [userId]
        );

        console.log(`Created instructor: ${instructor.firstname} ${instructor.lastname} (${instructor.username}) with user_id: ${userId}`);

      } catch (err) {
        console.error(`Error creating instructor ${instructor.username}:`, err.message);
      }
    }

    console.log('Instructor population complete!');
    console.log('Default password for all instructors: gettysburg2025');

  } catch (err) {
    console.error('Error populating instructors:', err.message);
  } finally {
    await connection.end();
  }
}

populateInstructors(); 
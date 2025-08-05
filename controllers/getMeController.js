import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import { isInstructor } from '../utils/is_instructor.js';

export async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const { user_id, username } = req.user;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // First, get user info
    const [userRows] = await connection.execute(
      `SELECT firstname, lastname, hasReset FROM users WHERE user_id = ?`,
      [user_id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { firstname, lastname, hasReset } = userRows[0];

    // Check if user is an instructor
    const is_instructor = await isInstructor(user_id, connection);

    if (!is_instructor) {
      // Student: get their class and instructor
      const [rows] = await connection.execute(
        `SELECT c.class_year, c.semester,
                i.firstname AS instructor_firstname, i.lastname AS instructor_lastname
         FROM class_students cs
         JOIN class c ON cs.class_id = c.class_id
         JOIN users i ON c.instructor_id = i.user_id
         WHERE cs.student_id = ?`,
        [user_id]
      );
      if (rows.length === 0) {
        // Student exists but not enrolled in any classes
        res.json({ 
          user: { 
            user_id, 
            username, 
            firstname, 
            lastname, 
            class_year: null, 
            semester: null, 
            instructor: null, 
            is_instructor, 
            hasReset 
          } 
        });
      } else {
        const { class_year, semester, instructor_firstname, instructor_lastname } = rows[0];
        const instructor = `${instructor_firstname} ${instructor_lastname}`;
        res.json({ user: { user_id, username, firstname, lastname, class_year, semester, instructor, is_instructor, hasReset } });
      }
    } else {
      // Instructor: get all classes they teach
      const [rows] = await connection.execute(
        `SELECT class_id, class_year, semester
         FROM class
         WHERE instructor_id = ?
         ORDER BY class_year, semester`,
        [user_id]
      );
      res.json({ user: { user_id, username, firstname, lastname, is_instructor, classes: rows, hasReset } });
    }
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
} 
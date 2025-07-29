import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import { formatDateTime } from '../utils/dateUtils.js';

export async function getInstructorInfo(req, res) {
  const user_id = req.user.user_id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Verify this user is an instructor
    const [instructorCheck] = await connection.execute(
      'SELECT 1 FROM instructors WHERE user_id = ? LIMIT 1',
      [user_id]
    );
    
    if (instructorCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied. Instructor only.' });
    }
    
    // Get all classes where this user is the instructor, along with students
    const [rows] = await connection.execute(
      `SELECT 
        c.class_id,
        c.class_year,
        c.semester,
        s.user_id as student_id,
        s.firstname as student_firstname,
        s.lastname as student_lastname,
        s.username as student_username
      FROM class_students cs
      JOIN class c ON cs.class_id = c.class_id
      JOIN users s ON cs.student_id = s.user_id
      WHERE cs.instructor_id = ?
      ORDER BY c.class_year, c.semester, s.lastname, s.firstname`,
      [user_id]
    );

    // Group the results by class
    const classesMap = {};
    rows.forEach(row => {
      const classKey = `${row.class_id}`;
      if (!classesMap[classKey]) {
        classesMap[classKey] = {
          class_id: row.class_id,
          class_year: row.class_year,
          semester: row.semester,
          students: []
        };
      }
      classesMap[classKey].students.push({
        user_id: row.student_id,
        firstname: row.student_firstname,
        lastname: row.student_lastname,
        username: row.student_username
      });
    });

    // Convert map to array
    const classes = Object.values(classesMap);

    res.json({ classes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
} 

// Get results for all students taught by this instructor
export async function getStudentResults(req, res) {
  const instructor_id = req.user.user_id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Get all results for students taught by this instructor
    const [rows] = await connection.execute(
      `SELECT r.id, r.created_at, r.user_id, 
              u.firstname, u.lastname, u.username
       FROM results r
       JOIN class_students cs ON r.user_id = cs.student_id
       JOIN users u ON r.user_id = u.user_id
       WHERE cs.instructor_id = ?
       ORDER BY r.created_at DESC`,
      [instructor_id]
    );
    
    // Format created_at to full datetime
    const formatted = rows.map(r => ({
      id: r.id,
      created_at: formatDateTime(r.created_at),
      user_id: r.user_id
    }));
    
    res.json({ results: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
}
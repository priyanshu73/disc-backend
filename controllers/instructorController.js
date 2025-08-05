import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import { formatDateTime } from '../utils/dateUtils.js';

export async function getInstructorInfo(req, res) {
  const user_id = req.user.user_id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
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
      FROM class c
      JOIN class_students cs ON c.class_id = cs.class_id
      JOIN users s ON cs.student_id = s.user_id
      WHERE c.instructor_id = ?
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

export async function deleteStudents(req, res) {
  const user_id = req.user.user_id;
  const { studentIds, classId } = req.body;
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'studentIds array is required and must not be empty' });
    }

    if (!classId) {
      return res.status(400).json({ error: 'classId is required' });
    }

    // Verify that all students belong to the specified class taught by this instructor
    const placeholders = studentIds.map(() => '?').join(',');
    const [studentCheck] = await connection.execute(
      `SELECT cs.student_id FROM class_students cs
       JOIN class c ON cs.class_id = c.class_id
       WHERE c.instructor_id = ? AND c.class_id = ? AND cs.student_id IN (${placeholders})`,
      [user_id, classId, ...studentIds]
    );

    if (studentCheck.length !== studentIds.length) {
      return res.status(403).json({ error: 'Some students are not in the specified class or do not exist' });
    }

    // Delete class_students entries for the specified students from the specified class
    const [result] = await connection.execute(
      `DELETE cs FROM class_students cs
       JOIN class c ON cs.class_id = c.class_id
       WHERE c.instructor_id = ? AND c.class_id = ? AND cs.student_id IN (${placeholders})`,
      [user_id, classId, ...studentIds]
    );

    res.json({ 
      message: 'Students deleted successfully',
      deletedCount: result.affectedRows,
      deletedStudentIds: studentIds,
      classId: classId
    });

  } catch (err) {
    console.error('Delete students error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
} 

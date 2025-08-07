import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import { formatDateTime } from '../utils/dateUtils.js';
import { isInstructor } from '../utils/is_instructor.js';
import { getSegment } from '../utils/disc_info.js';

export async function getResults(req, res) {
  const current_user_id = req.user.user_id;
  const student_id = req.query.student_id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check if current user is an instructor
    const isInstructorUser = await isInstructor(current_user_id, connection);
    
    let target_user_id = current_user_id;
    
    // If instructor and student_id provided, verify they can access that student's results
    if (isInstructorUser && student_id) {
      const [classCheck] = await connection.execute(
        `SELECT 1 FROM class_students cs
         JOIN class c ON cs.class_id = c.class_id
         WHERE c.instructor_id = ? AND cs.student_id = ? LIMIT 1`,
        [current_user_id, student_id]
      );
      
      if (classCheck.length === 0) {
        return res.status(403).json({ error: 'Student not found in your classes' });
      }
      target_user_id = student_id;
    } else if (isInstructorUser && !student_id) {
      return res.status(400).json({ error: 'Student ID required for instructor access' });
    }
    
    const [rows] = await connection.execute(
      'SELECT id, created_at FROM results WHERE user_id = ? ORDER BY created_at DESC',
      [target_user_id]
    );
    // Format created_at to full datetime
    const formatted = rows.map(r => ({
      id: r.id,
      created_at: formatDateTime(r.created_at)
    }));
    res.json({ results: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
}

export async function getResultById(req, res) {
  const current_user_id = req.user.user_id;
  const result_id = req.params.id;
  const student_id = req.query.student_id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check if current user is an instructor
    const isInstructorUser = await isInstructor(current_user_id, connection);
    
    let target_user_id = current_user_id;
    
    // If instructor and student_id provided, verify they can access that student's results
    if (isInstructorUser && student_id) {
      const [classCheck] = await connection.execute(
        `SELECT 1 FROM class_students cs
         JOIN class c ON cs.class_id = c.class_id
         WHERE c.instructor_id = ? AND cs.student_id = ? LIMIT 1`,
        [current_user_id, student_id]
      );
      
      if (classCheck.length === 0) {
        return res.status(403).json({ error: 'Student not found in your classes' });
      }
      target_user_id = student_id;
    } else if (isInstructorUser && !student_id) {
      return res.status(400).json({ error: 'Student ID required for instructor access' });
    }
    
    const [rows] = await connection.execute(
      `SELECT 
        r.id,
        r.user_id,
        r.most_counts,
        r.least_counts,
        r.created_at,
        p.pid,
        p.pname,
        cpp.emotions,
        cpp.goal,
        cpp.judges_others_by,
        cpp.influences_others_by,
        cpp.value_to_organization,
        cpp.overuses,
        cpp.under_pressure,
        cpp.fears,
        cpp.would_increase_effectiveness_through,
        cpp.general_description
      FROM results r
      JOIN ClassicProfilePatterns cpp ON r.classic_profile_pattern_id = cpp.id
      JOIN pattern p ON cpp.pid = p.pid
      WHERE r.id = ? AND r.user_id = ?`,
      [result_id, target_user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    // Calculate segno dynamically from stored counts
    // Handle both string and object formats for JSON fields
    const mostCounts = typeof rows[0].most_counts === 'string' 
      ? JSON.parse(rows[0].most_counts) 
      : rows[0].most_counts;
    const leastCounts = typeof rows[0].least_counts === 'string' 
      ? JSON.parse(rows[0].least_counts) 
      : rows[0].least_counts;
    
    const diff = {
      Z: (mostCounts.Z || 0) - (leastCounts.Z || 0), // D
      S: (mostCounts.S || 0) - (leastCounts.S || 0), // i
      T: (mostCounts.T || 0) - (leastCounts.T || 0), // S
      '*': (mostCounts['*'] || 0) - (leastCounts['*'] || 0) // C
    };
    
    const segno = [
      getSegment('D', diff.Z),
      getSegment('i', diff.S),
      getSegment('S', diff.T),
      getSegment('C', diff['*'])
    ].join('');
    
    // Add calculated segno to the result
    const result = {
      ...rows[0],
      segno: parseInt(segno, 10)
    };
    
    
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
}
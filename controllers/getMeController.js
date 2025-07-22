import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

export async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const { user_id, username } = req.user;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT u.firstname, u.lastname, u.hasReset, c.class_year, c.semester, c.instructor
       FROM users u
       JOIN class c ON u.class_id = c.class_id
       WHERE u.user_id = ?`,
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { firstname, lastname, hasReset, class_year, semester, instructor } = rows[0];
    res.json({ user: { user_id, username, firstname, lastname, class_year, semester, instructor, hasReset } });
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
} 
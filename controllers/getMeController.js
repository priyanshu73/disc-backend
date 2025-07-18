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
      'SELECT firstname, hasReset FROM users WHERE user_id = ?',
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { firstname, hasReset } = rows[0];
    res.json({ user: { user_id, username, firstname, hasReset } });
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
} 
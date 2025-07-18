import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import bcrypt from 'bcryptjs';

export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  const { user_id } = req.user || {};
  if (!user_id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new password are required.' });
  }
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // Get current hashed password
    const [rows] = await connection.execute(
      'SELECT password FROM users WHERE user_id = ?',
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const currentHashed = rows[0].password;
    const match = await bcrypt.compare(oldPassword, currentHashed);
    if (!match) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }
    // Hash new password
    const newHashed = await bcrypt.hash(newPassword, 10);
    await connection.execute(
      'UPDATE users SET password = ?, hasReset = ? WHERE user_id = ?',
      [newHashed, true, user_id]
    );
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) await connection.end();
  }
} 
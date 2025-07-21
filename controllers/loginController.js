import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gettysburgcompsci';
const JWT_EXPIRES_IN = '2h';

export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    // Issue JWT and set as cookie
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',  // Change from 'strict' to 'lax'
      domain: 'localhost',  // Add this
      path: '/',  // Add this - crucial!
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });
    res.json({ message: 'Login successful', user: { username: user.username, user_id: user.user_id } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    if (connection) await connection.end();
  }
} 
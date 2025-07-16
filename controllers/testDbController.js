import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

const testDb = async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM pattern');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};

export default { testDb }; 
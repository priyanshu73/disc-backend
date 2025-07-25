import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

function formatTimeHM(dateString) {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export async function getResults(req, res) {
  const user_id = req.user.user_id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, created_at FROM results WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    // Format created_at to HH:mm
    const formatted = rows.map(r => ({
      id: r.id,
      created_at: formatTimeHM(r.created_at)
    }));
    res.json({ results: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
}

export async function getResultById(req, res) {
  const user_id = req.user.user_id;
  const result_id = req.params.id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
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
      [result_id, user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json({ result: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
} 
import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

const data = [
  ['A1', 'Achiever'],
  ['A2', 'Agent'],
  ['A3', 'Appraiser'],
  ['C1', 'Counselor'],
  ['C2', 'Creative'],
  ['D1', 'Developer'],
  ['I1', 'Inspirational'],
  ['I2', 'Investigator'],
  ['O1', 'Objective Thinker'],
  ['O2', 'Overshift'],
  ['P1', 'Perfectionist'],
  ['P2', 'Persuader'],
  ['P3', 'Practitioner'],
  ['P4', 'Promoter'],
  ['R1', 'Result Oriented'],
  ['S1', 'Specialist'],
  ['T1', 'Tight'],
  ['U1', 'Undershift'],
];

async function populatePattern() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.execute(`CREATE TABLE IF NOT EXISTS patternTable (segno INT NOT NULL PRIMARY KEY,pid CHAR(2))`);
    await connection.query('DELETE FROM pattern'); // Clear existing data
    await connection.query('INSERT INTO pattern (pid, pname) VALUES ?', [data]);
    console.log('pattern table populated successfully.');
  } catch (err) {
    console.error('Error populating pattern table:', err.message);
  } finally {
    await connection.end();
  }
}

populatePattern(); 
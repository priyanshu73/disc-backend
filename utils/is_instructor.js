import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';

export async function isInstructor(user_id, connection = null) {
    if (!connection) {
        connection = await mysql.createConnection(dbConfig);
    }
    const [instructorCheck] = await connection.execute(
        'SELECT 1 FROM instructors WHERE user_id = ? LIMIT 1',
        [user_id]
    );
    const is_instructor = instructorCheck.length > 0; 
    return is_instructor;
}
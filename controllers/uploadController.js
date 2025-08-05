import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadStudents = async (req, res) => {
  // Check if user is instructor
  const user_id = req.user.user_id;
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { classYear, semester } = req.body;
    
    // Validate inputs
    if (!classYear || !semester) {
      return res.status(400).json({ error: 'Class year and semester are required' });
    }
    
    if (!['S', 'F'].includes(semester)) {
      return res.status(400).json({ error: 'Semester must be S (Spring) or F (Fall)' });
    }

    const classYearInt = parseInt(classYear, 10);
    if (isNaN(classYearInt) || classYearInt < 2020 || classYearInt > 2030) {
      return res.status(400).json({ error: 'Class year must be a valid year between 2020-2030' });
    }

    // Check if class already exists, if not create it
    let [existingClass] = await connection.execute(
      'SELECT class_id FROM class WHERE class_year = ? AND semester = ? AND instructor_id = ?',
      [classYearInt, semester, user_id]
    );

    let classId;
    if (existingClass.length === 0) {
      // Create new class with instructor_id
      const [result] = await connection.execute(
        'INSERT INTO class (class_year, semester, instructor_id) VALUES (?, ?, ?)',
        [classYearInt, semester, user_id]
      );
      classId = result.insertId;
    } else {
      classId = existingClass[0].class_id;
    }

    // Parse CSV file
    const students = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
         
          
          // Use the working approach - access by position in the keys array
          const keys = Object.keys(data);
          const firstname = data[keys[0]];
          const lastname = data[keys[1]];
          const username = data[keys[2]];
          
          console.log('Parsed row:', data);
          console.log('Extracted values:', { firstname, lastname, username });
          
          if (firstname && lastname && username) {
            students.push({
              firstname: firstname.trim(),
              lastname: lastname.trim(),
              username: username.trim()
            });
            console.log('Added student to array. Current length:', students.length);
          } else {
            console.log('Skipping row due to missing data');
          }
        })
        .on('end', () => {
          console.log('CSV parsing completed. Total students found:', students.length);
          resolve();
        })
        .on('error', reject);
    });

    console.log('After Promise resolution. Students array length:', students.length);
    console.log('Students array content:', students);

    if (students.length === 0) {
      return res.status(400).json({ error: 'No valid student data found in CSV file' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('gettysburg2025', 10);

    // Insert students and link to class
    const insertedStudents = [];
    const errors = [];

    for (const student of students) {
      try {
        // Check if username already exists
        const [existingUser] = await connection.execute(
          'SELECT user_id FROM users WHERE username = ?',
          [student.username]
        );

        let studentId;
        if (existingUser.length > 0) {
          // Student already exists, use their existing user_id
          studentId = existingUser[0].user_id;
          
          // Check if student is already in this class
          const [existingClassStudent] = await connection.execute(
            'SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ?',
            [classId, studentId]
          );
          
          if (existingClassStudent.length > 0) {
            errors.push(`Student ${student.username} is already in this class`);
            continue;
          }
        } else {
          // Student doesn't exist, create new user
          const [userResult] = await connection.execute(
            'INSERT INTO users (firstname, lastname, username, password, hasReset) VALUES (?, ?, ?, ?, FALSE)',
            [student.firstname, student.lastname, student.username, hashedPassword]
          );
          studentId = userResult.insertId;
        }

        // Link student to class (whether they're new or existing)
        await connection.execute(
          'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)',
          [classId, studentId]
        );

        insertedStudents.push({
          user_id: studentId,
          firstname: student.firstname,
          lastname: student.lastname,
          username: student.username,
          is_existing_user: existingUser.length > 0
        });

      } catch (err) {
        errors.push(`Error processing ${student.username}: ${err.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Upload completed',
      class_id: classId,
      class_year: classYearInt,
      semester: semester,
      students_inserted: insertedStudents.length,
      students: insertedStudents,
      errors: errors
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};

// Export multer middleware for use in routes
export { upload };
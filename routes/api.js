import express from 'express';
import sampleController from '../controllers/sampleController.js';
import testDbController from '../controllers/testDbController.js';
import adjectivesController from '../controllers/adjectivesController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isInstructorMiddleware } from '../middleware/isInstructorMiddleware.js';
import { getMe } from '../controllers/getMeController.js';
import { changePassword } from '../controllers/changePasswordController.js';
import { login } from '../controllers/loginController.js';
import { getResults, getResultById } from '../controllers/resultsController.js';
import { getInstructorInfo, deleteStudents } from '../controllers/instructorController.js';
import { uploadStudents, upload } from '../controllers/uploadController.js';

const router = express.Router();

// Example route
router.get('/hello', sampleController.sayHello);
router.get('/test-db', testDbController.testDb);
router.get('/adjectives', adjectivesController.getAllAdjectives);
router.get('/disc-questions', adjectivesController.getDiscQuestions);
router.post('/submit-answers', authMiddleware, adjectivesController.submitAnswers);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, changePassword);
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ message: 'Logged out' });
});
router.get('/results', authMiddleware, getResults);
router.get('/results/:id', authMiddleware, getResultById);
router.get('/instructors/info', authMiddleware, isInstructorMiddleware, getInstructorInfo);
router.post('/upload-students', authMiddleware, isInstructorMiddleware, upload.single('file'), uploadStudents);
router.delete('/delete-students', authMiddleware, isInstructorMiddleware, deleteStudents);

export default router; 
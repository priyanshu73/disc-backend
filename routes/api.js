import express from 'express';
import sampleController from '../controllers/sampleController.js';
import testDbController from '../controllers/testDbController.js';
import adjectivesController from '../controllers/adjectivesController.js';

const router = express.Router();

// Example route
router.get('/hello', sampleController.sayHello);
router.get('/test-db', testDbController.testDb);
router.get('/adjectives', adjectivesController.getAllAdjectives);
router.get('/disc-questions', adjectivesController.getDiscQuestions);
router.post('/submit-answers', adjectivesController.submitAnswers);

export default router; 
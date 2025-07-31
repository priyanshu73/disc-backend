import { isInstructor } from '../utils/is_instructor.js';

export const isInstructorMiddleware = async (req, res, next) => {
  const user_id = req.user.user_id;
  
  try {
    const isInstructorUser = await isInstructor(user_id);
    
    if (!isInstructorUser) {
      return res.status(403).json({ error: 'Access denied. Instructor only.' });
    }
    
    next();
  } catch (err) {
    console.error('Instructor check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 
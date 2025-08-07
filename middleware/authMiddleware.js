import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gettysburgcompsci';

export function authMiddleware(req, res, next) {
  
  const token = req.cookies?.token;
  if (!token) {
    console.log('No token found in cookies');
    return res.status(401).json({ message: 'Authentication required.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log('Token verified, user:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
} 
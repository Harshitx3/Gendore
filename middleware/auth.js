const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  // Skip authentication for public routes
  if (req.path.includes('/auth/') || req.path === '/auth') {
    return next();
  }
  
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      console.log('No token provided for path:', req.path);
      // Allow the request to proceed without authentication for testing
      req.user = null;
      req.isAuthenticated = false;
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      console.log('Token decoded:', decoded);
      
      // Find user - using id instead of userId to match token format
      const user = await User.findById(decoded.id || decoded.userId).select('-password');
      
      if (!user) {
        console.log('User not found for decoded token:', decoded);
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('User authenticated:', user.name, user._id);
      
      // Set user and auth status
      req.user = user;
      req.isAuthenticated = true;
      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Require authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

module.exports = { auth, requireAuth };
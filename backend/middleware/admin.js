module.exports = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  next();
};

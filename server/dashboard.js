const express = require('express');
const { User } = require('./models');
const router = express.Router();

// Middleware to check admin
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// Example admin dashboard route
router.get('/admin', isAdmin, async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'username', 'role', 'name', 'email'] });
  res.json({ users });
});

module.exports = router;

const express = require('express');
const { User, Student, Activity } = require('./models');
const { Op } = require('sequelize');
const router = express.Router();

// Middleware to check admin
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// Example admin dashboard route - includes recent activity
router.get('/admin', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'role', 'name', 'email', 'lastLogin'] });
    // fetch activity entries (login, student_created, etc.)
    const activities = await Activity.findAll({ include: [{ model: User, attributes: ['id','name','username'] }], order: [['createdAt','DESC']], limit: 20 });
    const activity = activities.map(a => ({ id: a.id, type: a.type, message: a.message, time: a.createdAt, name: a.User ? (a.User.name || a.User.username) : undefined }));

    res.json({ users, activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

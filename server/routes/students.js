const express = require('express');
const router = express.Router();
const { Student, Activity, User } = require('../models');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware');

function permitRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

router.use(authMiddleware);

// Create student (admin/teacher)
router.post('/', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    try {
      const actorName = req.user ? (req.user.name || req.user.username) : 'User';
      const act = await Activity.create({ type: 'student_created', userId: req.user ? req.user.id : null, message: `${actorName} created student ${student.name}` });
      const io = require('../socket').getIo();
      const payload = { id: act.id, type: act.type, message: act.message, time: act.createdAt, name: student.name, actor: actorName };
      if (io) io.emit('activity', payload);
    } catch(e) {}
    res.status(201).json({ student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List students (authenticated users)
router.get('/', async (req, res) => {
  const students = await Student.findAll({ attributes: ['id','rollNumber','name','class','section','email','guardianName','phone'] });
  res.json({ students });
});

router.get('/:id', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json({ student });
});

router.put('/:id', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    const oldRoll = student.rollNumber;
    await student.update(req.body);

    // if rollNumber changed, update associated User username
    if (req.body.rollNumber && req.body.rollNumber !== oldRoll) {
      const u = await User.findOne({ where: { username: oldRoll } });
      if (u) await u.update({ username: req.body.rollNumber });
    }

    // if password provided, create/update user password
    if (req.body.password) {
      const hash = await bcrypt.hash(req.body.password, 10);
      let user = await User.findOne({ where: { username: req.body.rollNumber || oldRoll } });
      if (user) {
        await user.update({ password: hash, name: student.name, email: student.email });
      } else {
        await User.create({ username: req.body.rollNumber || oldRoll, password: hash, role: 'student', name: student.name, email: student.email });
      }
    }

    res.json({ student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  await student.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

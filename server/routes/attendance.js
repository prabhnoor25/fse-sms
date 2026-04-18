const express = require('express');
const router = express.Router();
const { Attendance } = require('../models');
const { authMiddleware } = require('../middleware');

function permitRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

router.use(authMiddleware);

router.post('/', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const a = await Attendance.create(req.body);
    res.status(201).json({ attendance: a });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/student/:studentId', async (req, res) => {
  const records = await Attendance.findAll({ where: { studentId: req.params.studentId } });
  res.json({ attendance: records });
});

router.get('/class/:classId', async (req, res) => {
  const records = await Attendance.findAll({ where: { classId: req.params.classId } });
  res.json({ attendance: records });
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const a = await Attendance.findByPk(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  await a.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

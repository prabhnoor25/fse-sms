const express = require('express');
const router = express.Router();
const { Enrollment } = require('../models');
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
    const enrollment = await Enrollment.create(req.body);
    res.status(201).json({ enrollment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const enrollments = await Enrollment.findAll();
  res.json({ enrollments });
});

router.get('/class/:classId', async (req, res) => {
  const enrollments = await Enrollment.findAll({ where: { classId: req.params.classId } });
  res.json({ enrollments });
});

router.get('/student/:studentId', async (req, res) => {
  const enrollments = await Enrollment.findAll({ where: { studentId: req.params.studentId } });
  res.json({ enrollments });
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const e = await Enrollment.findByPk(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  await e.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

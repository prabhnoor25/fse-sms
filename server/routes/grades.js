const express = require('express');
const router = express.Router();
const { Grade } = require('../models');
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
    const g = await Grade.create(req.body);
    res.status(201).json({ grade: g });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/student/:studentId', async (req, res) => {
  const grades = await Grade.findAll({ where: { studentId: req.params.studentId } });
  res.json({ grades });
});

router.put('/:id', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const g = await Grade.findByPk(req.params.id);
    if (!g) return res.status(404).json({ error: 'Not found' });
    await g.update(req.body);
    res.json({ grade: g });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const g = await Grade.findByPk(req.params.id);
  if (!g) return res.status(404).json({ error: 'Not found' });
  await g.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

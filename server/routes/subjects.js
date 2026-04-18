const express = require('express');
const router = express.Router();
const { Subject } = require('../models');
const { authMiddleware } = require('../middleware');

function permitRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

router.use(authMiddleware);

// Create subject (admin/teacher)
router.post('/', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ subject });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List subjects
router.get('/', async (req, res) => {
  const subjects = await Subject.findAll({ attributes: ['id','code','name','description','classId'] });
  res.json({ subjects });
});

router.get('/:id', async (req, res) => {
  const subject = await Subject.findByPk(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Not found' });
  res.json({ subject });
});

router.put('/:id', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Not found' });
    await subject.update(req.body);
    res.json({ subject });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const subject = await Subject.findByPk(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Not found' });
  await subject.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

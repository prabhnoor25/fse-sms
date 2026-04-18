const express = require('express');
const router = express.Router();
const { SchoolClass } = require('../models');
const { authMiddleware } = require('../middleware');

function permitRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

router.use(authMiddleware);

// Create class (admin/teacher)
router.post('/', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const cls = await SchoolClass.create(req.body);
    res.status(201).json({ class: cls });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List classes
router.get('/', async (req, res) => {
  const classes = await SchoolClass.findAll({ attributes: ['id','name','grade','section','teacherId'] });
  res.json({ classes });
});

router.get('/:id', async (req, res) => {
  const cls = await SchoolClass.findByPk(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Not found' });
  res.json({ class: cls });
});

router.put('/:id', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const cls = await SchoolClass.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Not found' });
    await cls.update(req.body);
    res.json({ class: cls });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const cls = await SchoolClass.findByPk(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Not found' });
  await cls.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

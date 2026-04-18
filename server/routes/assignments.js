const express = require('express');
const router = express.Router();
const { Assignment } = require('../models');
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
    const a = await Assignment.create(req.body);
    res.status(201).json({ assignment: a });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const assignments = await Assignment.findAll();
  res.json({ assignments });
});

router.get('/:id', async (req, res) => {
  const a = await Assignment.findByPk(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json({ assignment: a });
});

router.put('/:id', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const a = await Assignment.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Not found' });
    await a.update(req.body);
    res.json({ assignment: a });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const a = await Assignment.findByPk(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  await a.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Teacher } = require('../models');
const { authMiddleware } = require('../middleware');

function permitRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

router.use(authMiddleware);

// Create teacher (admin) - admin provides password; a corresponding User is created
router.post('/', permitRoles('admin'), async (req, res) => {
  const { employeeId, name, email, phone, subjects, password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: employeeId, password: hash, role: 'teacher', name, email });
    const teacher = await Teacher.create({ employeeId, name, email, phone, subjects });
    return res.status(201).json({ teacher });
  } catch (err) {
    // attempt cleanup if user was created but teacher failed
    try { await User.destroy({ where: { username: employeeId } }); } catch (e) {}
    res.status(400).json({ error: err.message });
  }
});

// List teachers (authenticated users)
router.get('/', async (req, res) => {
  const teachers = await Teacher.findAll({ attributes: ['id','employeeId','name','email','phone','subjects'] });
  res.json({ teachers });
});

router.get('/:id', async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Not found' });
  res.json({ teacher });
});

router.put('/:id', permitRoles('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Not found' });
    await teacher.update(req.body);
    res.json({ teacher });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Not found' });
  await teacher.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

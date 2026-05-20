const express = require('express');
const router = express.Router();
const { Timetable, SchoolClass, Student, Teacher, Enrollment } = require('../models');
const { authMiddleware } = require('../middleware');

function permitRoles(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

router.use(authMiddleware);

// List timetables: admin gets all, others get relevant timetables (for their classes or global)
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const all = await Timetable.findAll();
      const parsed = all.map(t => ({ id: t.id, title: t.title, forClassId: t.forClassId, createdBy: t.createdBy, data: t.data ? JSON.parse(t.data) : null }));
      return res.json({ timetables: parsed });
    }

    let classIds = [];
    if (req.user.role === 'teacher') {
      // teacher username is employeeId
      const teacher = await Teacher.findOne({ where: { employeeId: req.user.username } });
      if (teacher) {
        const classes = await SchoolClass.findAll({ where: { teacherId: teacher.id }, attributes: ['id'] });
        classIds = classes.map(c => c.id);
      }
    }
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { rollNumber: req.user.username } });
      if (student) {
        const enrolls = await Enrollment.findAll({ where: { studentId: student.id } });
        classIds = enrolls.map(e => e.classId);
      }
    }

    // fetch timetables for these classes or global (forClassId IS NULL)
    const results = await Timetable.findAll({ where: {} });
    const filtered = results.filter(t => (t.forClassId === null || t.forClassId === undefined) || classIds.includes(t.forClassId));
    const parsed = filtered.map(t => ({ id: t.id, title: t.title, forClassId: t.forClassId, createdBy: t.createdBy, data: t.data ? JSON.parse(t.data) : null }));
    res.json({ timetables: parsed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single timetable
router.get('/:id', async (req, res) => {
  const t = await Timetable.findByPk(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const parsed = { id: t.id, title: t.title, forClassId: t.forClassId, createdBy: t.createdBy, data: t.data ? JSON.parse(t.data) : null };
  res.json({ timetable: parsed });
});

// Create (admin only)
router.post('/', permitRoles('admin'), async (req, res) => {
  try {
    const { title, data, forClassId } = req.body;
    if (!forClassId) return res.status(400).json({ error: 'forClassId is required' });
    const t = await Timetable.create({ title, data: typeof data === 'string' ? data : JSON.stringify(data || {}), forClassId: forClassId, createdBy: req.user.id });
    res.status(201).json({ timetable: { id: t.id, title: t.title, data: JSON.parse(t.data), forClassId: t.forClassId } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update (admin)
router.put('/:id', permitRoles('admin'), async (req, res) => {
  try {
    const t = await Timetable.findByPk(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    const { title, data, forClassId } = req.body;
    // prevent clearing the class - forClassId must be provided
    if (forClassId === null || forClassId === undefined) {
      return res.status(400).json({ error: 'forClassId is required and cannot be null' });
    }
    await t.update({ title: title !== undefined ? title : t.title, data: data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data)) : t.data, forClassId: forClassId !== undefined ? forClassId : t.forClassId });
    res.json({ timetable: { id: t.id, title: t.title, data: t.data ? JSON.parse(t.data) : null, forClassId: t.forClassId } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete (admin)
router.delete('/:id', permitRoles('admin'), async (req, res) => {
  const t = await Timetable.findByPk(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  await t.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;

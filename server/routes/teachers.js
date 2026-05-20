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

// List teachers (admins see all; students see teachers for their classes)
router.get('/', async (req, res) => {
  try {
    if (req.user && req.user.role === 'student') {
      const { User, Student, Enrollment, SchoolClass, Teacher, Subject } = require('../models');
      const userRecord = await User.findByPk(req.user.id);
      if (!userRecord) return res.json({ teachers: [] });
      const student = await Student.findOne({ where: { rollNumber: userRecord.username } });
      if (!student) return res.json({ teachers: [] });
      const enrollments = await Enrollment.findAll({ where: { studentId: student.id }, attributes: ['classId'] });
      const classIds = enrollments.map(e => e.classId);
      if (classIds.length === 0) return res.json({ teachers: [] });
      const classes = await SchoolClass.findAll({ where: { id: classIds }, attributes: ['id','name','teacherId'] });
      const teacherIds = [...new Set(classes.map(c => c.teacherId).filter(Boolean))];
      if (teacherIds.length === 0) return res.json({ teachers: [] });
      const teachers = await Teacher.findAll({ where: { id: teacherIds } });
      const subjects = await Subject.findAll({ where: { classId: classIds } });
      const subjectsById = {};
      subjects.forEach(s => { subjectsById[s.id] = s; });
      const result = teachers.map(t => {
        const subjIds = t.subjects ? String(t.subjects).split(',').map(x=>x.trim()).filter(Boolean) : [];
        const subjNames = subjIds.map(id => subjectsById[id] ? subjectsById[id].name : id).filter(Boolean);
        const classNames = classes.filter(c => c.teacherId === t.id).map(c => c.name);
        return { id: t.id, employeeId: t.employeeId, name: t.name, email: t.email, phone: t.phone, subjects: subjNames, classes: classNames };
      });
      return res.json({ teachers: result });
    }

    const teachers = await Teacher.findAll({ attributes: ['id','employeeId','name','email','phone','subjects'] });
    res.json({ teachers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

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

// Create student (admin only)
router.post('/', permitRoles('admin'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    try {
      const actorName = req.user ? (req.user.name || req.user.username) : 'User';
      const act = await Activity.create({ type: 'student_created', userId: req.user ? req.user.id : null, message: `${actorName} created student ${student.name}` });
    } catch(e) {}
    res.status(201).json({ student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List students (admins see all; teachers see only students for their classes; students see their own record)
router.get('/', async (req, res) => {
  try {
    if (req.user && req.user.role === 'teacher') {
      // find teacher record by the authenticated user id -> username (employeeId)
      const { Teacher, SchoolClass, Enrollment, User } = require('../models');
      const userRecord = await User.findByPk(req.user.id);
      if (!userRecord) return res.json({ students: [] });
      const teacher = await Teacher.findOne({ where: { employeeId: userRecord.username } });
      if (!teacher) return res.json({ students: [] });
      const classes = await SchoolClass.findAll({ where: { teacherId: teacher.id }, attributes: ['id'] });
      const classIds = classes.map(c => c.id);
      if (classIds.length === 0) return res.json({ students: [] });
      const enrollments = await Enrollment.findAll({ where: { classId: classIds }, attributes: ['studentId'] });
      const studentIds = [...new Set(enrollments.map(e => e.studentId))];
      if (studentIds.length === 0) return res.json({ students: [] });
      const students = await Student.findAll({ where: { id: studentIds }, attributes: ['id','rollNumber','name','class','section','email','guardianName','phone'] });
      return res.json({ students });
    }

    if (req.user && req.user.role === 'student') {
      // student should only see their own record (matched by rollNumber == username)
      const s = await Student.findOne({ where: { rollNumber: req.user.username }, attributes: ['id','rollNumber','name','class','section','email','guardianName','phone'] });
      return res.json({ students: s ? [s] : [] });
    }

    // admin or others: return all
    const students = await Student.findAll({ attributes: ['id','rollNumber','name','class','section','email','guardianName','phone'] });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json({ student });
});

router.put('/:id', permitRoles('admin'), async (req, res) => {
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

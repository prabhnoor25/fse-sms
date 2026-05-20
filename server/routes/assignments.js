const express = require('express');
const router = express.Router();
const { Assignment, AssignmentQuestion, Submission, SubmissionAnswer, Student } = require('../models');
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

// Questions
router.get('/:id/questions', async (req, res) => {
  const qs = await AssignmentQuestion.findAll({ where: { assignmentId: req.params.id } });
  // hide correctOption for students
  const out = qs.map(q => ({ id: q.id, text: q.text, options: q.options ? JSON.parse(q.options) : [], points: q.points, correctOption: (req.user.role === 'admin' || req.user.role === 'teacher') ? q.correctOption : undefined }));
  res.json({ questions: out });
});

router.post('/:id/questions', permitRoles('admin', 'teacher'), async (req, res) => {
  try {
    const payload = { assignmentId: req.params.id, text: req.body.text, options: JSON.stringify(req.body.options || []), correctOption: req.body.correctOption, points: req.body.points || 1 };
    const q = await AssignmentQuestion.create(payload);
    res.status(201).json({ question: q });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Submissions
router.post('/:id/submissions', permitRoles('student'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) return res.status(400).json({ error: 'Past due date' });

    const answers = req.body.answers || []; // [{ questionId, selectedOption }]
    const submission = await Submission.create({ assignmentId: req.params.id, studentId: req.user.id });
    let totalPoints = 0;
    let achieved = 0;
    const qs = await AssignmentQuestion.findAll({ where: { assignmentId: req.params.id } });
    const qMap = {};
    qs.forEach(q => { qMap[q.id] = q; totalPoints += q.points || 1; });

    for (const a of answers) {
      await SubmissionAnswer.create({ submissionId: submission.id, questionId: a.questionId, selectedOption: a.selectedOption });
      const q = qMap[a.questionId];
      if (q && q.correctOption !== null && q.correctOption !== undefined) {
        if (Number(a.selectedOption) === Number(q.correctOption)) achieved += (q.points || 1);
      }
    }
    const score = totalPoints > 0 ? Math.round((achieved / totalPoints) * 100) : 0;
    await submission.update({ score, graded: true });
    res.status(201).json({ submission: submission, score });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/:id/submissions', permitRoles('admin','teacher'), async (req, res) => {
  const subs = await Submission.findAll({ where: { assignmentId: req.params.id } });
  // enrich with student info and answers
  const out = [];
  for (const s of subs) {
    const stu = await Student.findByPk(s.studentId);
    const answers = await SubmissionAnswer.findAll({ where: { submissionId: s.id } });
    out.push({ submission: s, student: stu, answers });
  }
  res.json({ submissions: out });
});

router.get('/:id/stats', permitRoles('admin','teacher'), async (req, res) => {
  const subs = await Submission.findAll({ where: { assignmentId: req.params.id }, order: [['submittedAt','ASC']] });
  // best score per student
  const bestPerStudent = {};
  for (const s of subs) {
    if (!bestPerStudent[s.studentId] || bestPerStudent[s.studentId] < s.score) bestPerStudent[s.studentId] = s.score;
  }
  const studentRows = [];
  for (const sid of Object.keys(bestPerStudent)) {
    const stu = await Student.findByPk(sid);
    studentRows.push({ studentId: sid, name: stu ? stu.name : sid, score: bestPerStudent[sid] });
  }
  // highest score over time (per submission) — compute max up to each submission time
  const highestOverTime = [];
  let currentMax = 0;
  for (const s of subs) {
    if (s.score > currentMax) currentMax = s.score;
    highestOverTime.push({ submittedAt: s.submittedAt, highest: s.score > currentMax ? s.score : currentMax });
  }
  res.json({ students: studentRows, highestOverTime });
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

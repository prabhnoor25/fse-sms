require('dotenv').config();
const { sequelize, User, Student, Teacher, SchoolClass, Subject, Enrollment, Assignment, AssignmentQuestion, Submission, SubmissionAnswer, Attendance } = require('../models');
const bcrypt = require('bcryptjs');

async function main(){
  try{
    console.log('Disabling foreign key checks and truncating tables...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['SubmissionAnswers','Submissions','AssignmentQuestions','Assignments','Enrollments','Subjects','SchoolClasses','Teachers','Students','Users','Attendances'];
    for(const t of tables){
      try { await sequelize.query(`TRUNCATE TABLE \`${t}\``); console.log('Truncated', t); } catch(e){ console.warn('Could not truncate', t, e.message); }
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create admin user
    const adminPass = bcrypt.hashSync('admin', 8);
    const admin = await User.create({ username: 'admin', password: adminPass, role: 'admin', name: 'Administrator', email: 'admin@example.com' });
    console.log('Created admin:', admin.username);

    // Create 5 teachers
    const teachers = [];
    for(let i=1;i<=5;i++){
      const uname = `teacher${i}`;
      const pass = bcrypt.hashSync(uname, 8);
      const t = await Teacher.create({ employeeId: uname, name: `Teacher ${i}`, email: `${uname}@example.com`, phone: '', subjects: '' });
      await User.create({ username: uname, password: pass, role: 'teacher', name: `Teacher ${i}`, email: `${uname}@example.com` });
      teachers.push(t);
    }
    console.log('Created teachers:', teachers.map(t=>t.employeeId).join(', '));

    // Create 5 students
    const students = [];
    for(let i=1;i<=5;i++){
      const uname = `student${i}`;
      const pass = bcrypt.hashSync(uname, 8);
      const s = await Student.create({ rollNumber: uname, name: `Student ${i}`, class: '', section: '', email: `${uname}@example.com`, guardianName: '', phone: '' });
      await User.create({ username: uname, password: pass, role: 'student', name: `Student ${i}`, email: `${uname}@example.com` });
      students.push(s);
    }
    console.log('Created students:', students.map(s=>s.rollNumber).join(', '));

    // Create 5 classes and subjects
    const classes = [];
    const subjects = [];
    for(let i=1;i<=5;i++){
      const cls = await SchoolClass.create({ name: `Class ${i}`, grade: `${i}`, section: 'A', teacherId: teachers[i-1].id });
      classes.push(cls);
      const subj = await Subject.create({ code: `SUBJ${i}`, name: `Subject ${i}`, description: '', classId: cls.id });
      subjects.push(subj);
    }
    console.log('Created classes and subjects');

    // Enroll each student into matching class
    for(let i=0;i<students.length;i++){
      await Enrollment.create({ studentId: students[i].id, classId: classes[i].id });
    }
    console.log('Enrolled students into classes');

    // Create 5 assignments (one per class) with 5 questions each
    const assignments = [];
    const dueBase = new Date(); dueBase.setDate(dueBase.getDate()+7);
    for(let i=0;i<5;i++){
      const a = await Assignment.create({ title: `Assignment ${i+1}`, description: `Demo assignment ${i+1}`, dueDate: new Date(dueBase.getTime() + i*24*60*60*1000), classId: classes[i].id, subjectId: subjects[i].id, teacherId: teachers[i].id });
      assignments.push(a);
      // 5 questions
      for(let q=1;q<=5;q++){
        const options = [`Option A${q}`,'Option B','Option C','Option D'];
        const correct = 0; // always first option
        await AssignmentQuestion.create({ assignmentId: a.id, text: `Question ${q} for assignment ${i+1}`, options: JSON.stringify(options), correctOption: correct, points: 1 });
      }
    }
    console.log('Created assignments with questions');

    // Create attendances for each student (3 days)
    const today = new Date();
    for(const s of students){
      for(let d=0; d<3; d++){
        const dt = new Date(today.getTime() - d*24*60*60*1000);
        await Attendance.create({ studentId: s.id, classId: classes[students.indexOf(s)].id, date: dt.toISOString().slice(0,10), status: (d%2===0? 'present':'absent') });
      }
    }
    console.log('Created attendance records');

    // Create sample submissions: each student submits for their class assignment and gets full marks
    for(let i=0;i<students.length;i++){
      const stu = students[i];
      const assign = assignments[i];
      const qs = await AssignmentQuestion.findAll({ where: { assignmentId: assign.id } });
      const submission = await Submission.create({ assignmentId: assign.id, studentId: stu.id });
      let total = 0; let achieved = 0;
      for(const q of qs){
        const selected = q.correctOption; // pick correct
        await SubmissionAnswer.create({ submissionId: submission.id, questionId: q.id, selectedOption: selected });
        total += q.points || 1; achieved += (q.points || 1);
      }
      const score = total>0 ? Math.round((achieved/total)*100) : 0;
      await submission.update({ score, graded: true });
    }
    console.log('Created demo submissions (auto-graded)');

    // Output counts
    const counts = {};
    const checkTables = { users: 'Users', students: 'Students', teachers: 'Teachers', classes: 'SchoolClasses', subjects: 'Subjects', assignments: 'Assignments', questions: 'AssignmentQuestions', submissions: 'Submissions', attendance: 'Attendances' };
    for(const k of Object.keys(checkTables)){
      const t = checkTables[k];
      try{
        const [[res]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
        counts[k] = res.cnt;
      }catch(e){ counts[k] = 'err'; }
    }
    console.log('Counts:', counts);

    console.log('Seeding complete.');
    process.exit(0);
  }catch(err){
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();

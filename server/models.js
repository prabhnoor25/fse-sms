const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'school_db', process.env.DB_USER || 'root', process.env.DB_PASS || '', {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'student'), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  lastLogin: { type: DataTypes.DATE }
});

const Student = sequelize.define('Student', {
  rollNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  class: { type: DataTypes.STRING },
  section: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  guardianName: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING }
});

const Teacher = sequelize.define('Teacher', {
  employeeId: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING },
  subjects: { type: DataTypes.STRING }
});

const SchoolClass = sequelize.define('SchoolClass', {
  name: { type: DataTypes.STRING, allowNull: false },
  grade: { type: DataTypes.STRING },
  section: { type: DataTypes.STRING },
  teacherId: { type: DataTypes.INTEGER }
});

const Subject = sequelize.define('Subject', {
  code: { type: DataTypes.STRING, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  classId: { type: DataTypes.INTEGER }
});

// Associations
Teacher.hasMany(SchoolClass, { foreignKey: 'teacherId' });
SchoolClass.belongsTo(Teacher, { foreignKey: 'teacherId' });
SchoolClass.hasMany(Subject, { foreignKey: 'classId' });
Subject.belongsTo(SchoolClass, { foreignKey: 'classId' });

const Enrollment = sequelize.define('Enrollment', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Assignment = sequelize.define('Assignment', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  dueDate: { type: DataTypes.DATE },
  classId: { type: DataTypes.INTEGER },
  subjectId: { type: DataTypes.INTEGER },
  teacherId: { type: DataTypes.INTEGER }
});

const Grade = sequelize.define('Grade', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  assignmentId: { type: DataTypes.INTEGER, allowNull: false },
  marks: { type: DataTypes.FLOAT },
  remarks: { type: DataTypes.TEXT }
});

const Attendance = sequelize.define('Attendance', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('present','absent','late','excused'), defaultValue: 'present' }
});

// Enrollment associations
Student.belongsToMany(SchoolClass, { through: Enrollment, foreignKey: 'studentId', otherKey: 'classId' });
SchoolClass.belongsToMany(Student, { through: Enrollment, foreignKey: 'classId', otherKey: 'studentId' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId' });
Enrollment.belongsTo(SchoolClass, { foreignKey: 'classId' });

// Assignment associations
Assignment.belongsTo(SchoolClass, { foreignKey: 'classId' });
Assignment.belongsTo(Subject, { foreignKey: 'subjectId' });
Assignment.belongsTo(Teacher, { foreignKey: 'teacherId' });
SchoolClass.hasMany(Assignment, { foreignKey: 'classId' });
Subject.hasMany(Assignment, { foreignKey: 'subjectId' });
Teacher.hasMany(Assignment, { foreignKey: 'teacherId' });

// Grade associations
Grade.belongsTo(Assignment, { foreignKey: 'assignmentId' });
Grade.belongsTo(Student, { foreignKey: 'studentId' });
Assignment.hasMany(Grade, { foreignKey: 'assignmentId' });
Student.hasMany(Grade, { foreignKey: 'studentId' });

// Attendance associations
Attendance.belongsTo(Student, { foreignKey: 'studentId' });
Attendance.belongsTo(SchoolClass, { foreignKey: 'classId' });
Student.hasMany(Attendance, { foreignKey: 'studentId' });
SchoolClass.hasMany(Attendance, { foreignKey: 'classId' });

const Activity = sequelize.define('Activity', {
  type: { type: DataTypes.STRING },
  userId: { type: DataTypes.INTEGER },
  message: { type: DataTypes.STRING },
  meta: { type: DataTypes.TEXT }
});

Activity.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Activity, { foreignKey: 'userId' });

module.exports = { sequelize, User, Student, Teacher, SchoolClass, Subject, Enrollment, Assignment, Grade, Attendance, Activity };

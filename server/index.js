require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const { authMiddleware } = require('./middleware');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', authMiddleware, require('./dashboard'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/timetables', authMiddleware, require('./routes/timetables'));

// Sync DB and start server
sequelize.sync({ alter: true }).then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB sync failed:', err);
  process.exit(1);
});

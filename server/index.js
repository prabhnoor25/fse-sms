require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
// Models will be required after creation

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const { authMiddleware } = require('./middleware');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', authMiddleware, require('./dashboard'));

// Sync DB and start server (sequelize to be added)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

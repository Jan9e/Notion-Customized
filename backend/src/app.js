const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const pagesRoutes = require('./routes/pages');
const foldersRoutes = require('./routes/folders');
const workspacesRoutes = require('./routes/workspaces');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/workspaces', workspacesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app; 
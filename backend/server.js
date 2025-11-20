const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/admin/acm-sync', require('./routes/acmSync'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EventEase API is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventease', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  // Start reminder scheduler after DB connection
  const { startScheduler } = require('./services/reminderScheduler');
  startScheduler();
  // Start ACM sync scheduler (optional - configured via env)
  try {
    const { startAcmSync } = require('./services/acmSyncService');
    startAcmSync();
  } catch (e) {
    console.warn('ACM sync service not available or failed to start:', e.message || e);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


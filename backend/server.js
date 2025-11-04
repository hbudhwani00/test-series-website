const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected Successfully'))
.catch((err) => console.error('MongoDB Connection Error:', err));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test Series Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/demo-test', require('./routes/demoTest'));
app.use('/api/demo', require('./routes/demoTestStudent'));
app.use('/api/scheduled-tests', require('./routes/scheduledTests'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/results', require('./routes/results'));
app.use('/api/promocodes', require('./routes/promocode'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/test-series', require('./routes/testSeries'));
app.use('/api/ai', require('./routes/ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

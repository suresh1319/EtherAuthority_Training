require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const taskRoutes = require('./src/routes/taskRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: '📝 Welcome to Task Submission API',
        version: '1.0.0',
        endpoints: {
            submit: 'POST /api/tasks/submit',
            getAll: 'GET /api/tasks',
            getById: 'GET /api/tasks/:id',
            getByIntern: 'GET /api/tasks/intern/:internId',
            update: 'PUT /api/tasks/:id',
            delete: 'DELETE /api/tasks/:id',
            updateStatus: 'PATCH /api/tasks/:id/status',
            review: 'PATCH /api/tasks/:id/review',
            stats: 'GET /api/tasks/stats/summary',
        },
    });
});

app.use('/api/tasks', taskRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`📡 API available at http://localhost:${PORT}`);
});

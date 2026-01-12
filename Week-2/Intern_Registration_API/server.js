require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const internRoutes = require('./src/routes/internRoutes');
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
        message: '🚀 Welcome to Intern Registration API',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/interns/register',
            getAll: 'GET /api/interns',
            getById: 'GET /api/interns/:id',
            update: 'PUT /api/interns/:id',
            delete: 'DELETE /api/interns/:id',
            updateStatus: 'PATCH /api/interns/:id/status',
        },
    });
});

app.use('/api/interns', internRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`📡 API available at http://localhost:${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARE (Fixed) ---
// 1. Set limit to 50mb for image uploads
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Enable CORS (Only once)
app.use(cors());

// --- ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

// --- SERVER START ---
// Render will automatically inject process.env.PORT (e.g., 10000)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

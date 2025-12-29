const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Middleware
app.use(express.json()); // Allows us to read JSON data
app.use(cors()); // Allows frontend to connect

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

const PORT = process.env.PORT || 5000;
const NETWORK_PORT = process.env.NETWORK_PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const morgan = require('morgan');
const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Dossier uploads accessible publiquement
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const userRoutes = require('./routes/userRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const ambassadorCampaignRoutes = require('./routes/ambassadorCampaignRoutes');
const ambassadorCampaignsRoutes = require('./routes/ambassadorCampaignsRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ambassador-campaigns', ambassadorCampaignsRoutes);
app.use('/api/publications', ambassadorCampaignRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

module.exports = app;
// Middleware de gestion d'erreur (à placer après les routes)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

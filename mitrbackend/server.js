import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes         from './routes/authRoutes.js';
import eventRoutes        from './routes/eventRoutes.js';
import challengeRoutes    from './routes/challengeRoutes.js';
import submissionRoutes   from './routes/submissionRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import wellnessRoutes     from './routes/wellnessRoutes.js';
import eventReportRoutes  from './routes/eventReportRoutes.js';
import adminRoutes        from './routes/adminRoutes.js';
import journalRoutes      from './routes/journalRoutes.js';

dotenv.config();
connectDB();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'COEP मित्र API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/challenge',     challengeRoutes);
app.use('/api/submissions',   submissionRoutes);
app.use('/api/user',          userRoutes);
app.use('/api/wellness-info', wellnessRoutes);
app.use('/api/event-reports', eventReportRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/journal',       journalRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n COEP मित्र API running on port ${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health`);
  console.log(`   ENV:        ${process.env.NODE_ENV || 'production'}`);
  console.log(`   CORS allow: ${allowedOrigins.join(', ')}`);
  console.log(`   Mongo URI:  ${process.env.MONGO_URI ? '✅ Set' : '❌ MISSING'}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING'}`);
  console.log(`   Admin:      username=admin  password=mitr2026\n`);
});

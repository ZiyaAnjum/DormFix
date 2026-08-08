import './config/env.js';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import complaintsRouter from './routes/complaints.js';
import uploadRouter from './routes/upload.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { escalateOverdueComplaints } from './utils/escalation.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
}));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'DormFix API is running' });
});

app.use('/api/complaints', complaintsRouter);
app.use('/api/upload', uploadRouter);

app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in environment variables');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Run auto-escalation check on startup
  await escalateOverdueComplaints();
  // Run auto-escalation check every hour
  setInterval(escalateOverdueComplaints, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`DormFix API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

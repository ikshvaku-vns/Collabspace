import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import cardRoutes from './routes/cards';
import chatRoutes from './routes/chat';
import activityRoutes from './routes/activity';
import { setupSocket } from './socket';

dotenv.config({ path: '../.env' });
dotenv.config(); // also load from current dir (for Render)

const app = express();
const server = http.createServer(app);

// Support multiple origins (comma-separated in FRONTEND_URL)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity', activityRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO setup
setupSocket(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export { io };

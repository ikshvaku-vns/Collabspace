import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'collabspace_secret_key_2026';

// In-memory presence tracking (no Redis needed for single-instance)
interface OnlineUser {
  userId: string;
  displayName: string;
  socketId: string;
  workspaceId: string;
}

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  displayName: string;
  color: string;
}

const onlineUsers: Map<string, OnlineUser> = new Map();
const userCursors: Map<string, CursorPosition> = new Map();

// Generate a consistent color for a user
function getUserColor(userId: string): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function setupSocket(io: SocketIOServer): void {
  // JWT authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId).select('displayName email');
      if (!user) {
        return next(new Error('User not found'));
      }
      (socket as any).userId = decoded.userId;
      (socket as any).displayName = user.displayName;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const displayName = (socket as any).displayName as string;

    console.log(`🔌 User connected: ${displayName} (${socket.id})`);

    // Join workspace room
    socket.on('workspace:join', (workspaceId: string) => {
      socket.join(workspaceId);

      const userInfo: OnlineUser = { userId, displayName, socketId: socket.id, workspaceId };
      onlineUsers.set(socket.id, userInfo);

      // Notify room about new user
      socket.to(workspaceId).emit('user:joined', {
        userId,
        displayName,
        color: getUserColor(userId),
      });

      // Send current online users to the joining user
      const roomUsers: Array<{ userId: string; displayName: string; color: string }> = [];
      onlineUsers.forEach((u) => {
        if (u.workspaceId === workspaceId) {
          roomUsers.push({ userId: u.userId, displayName: u.displayName, color: getUserColor(u.userId) });
        }
      });
      socket.emit('workspace:users', roomUsers);

      console.log(`👤 ${displayName} joined workspace ${workspaceId}`);
    });

    // Leave workspace room
    socket.on('workspace:leave', (workspaceId: string) => {
      socket.leave(workspaceId);
      onlineUsers.delete(socket.id);
      userCursors.delete(socket.id);

      socket.to(workspaceId).emit('user:disconnected', { userId });
      socket.to(workspaceId).emit('cursor:remove', { userId });
    });

    // Cursor movement
    socket.on('cursor:move', (data: { x: number; y: number; workspaceId: string }) => {
      const cursor: CursorPosition = {
        x: data.x,
        y: data.y,
        userId,
        displayName,
        color: getUserColor(userId),
      };
      userCursors.set(socket.id, cursor);
      socket.to(data.workspaceId).emit('cursor:update', cursor);
    });

    // Card updates
    socket.on('card:update', (data: { cardId: string; field: string; value: any; workspaceId: string }) => {
      socket.to(data.workspaceId).emit('card:updated', {
        cardId: data.cardId,
        field: data.field,
        value: data.value,
        userId,
        displayName,
      });
    });

    // Card move between columns
    socket.on('card:move', (data: { cardId: string; fromColumn: string; toColumn: string; order: number; workspaceId: string }) => {
      socket.to(data.workspaceId).emit('card:moved', {
        cardId: data.cardId,
        fromColumn: data.fromColumn,
        toColumn: data.toColumn,
        order: data.order,
        userId,
        displayName,
      });
    });

    // Typing indicator
    socket.on('user:typing', (data: { cardId: string; isTyping: boolean; workspaceId: string }) => {
      socket.to(data.workspaceId).emit('user:typing', {
        userId,
        displayName,
        cardId: data.cardId,
        isTyping: data.isTyping,
      });
    });

    // Chat message
    socket.on('chat:message', async (data: { text: string; workspaceId: string }) => {
      try {
        const message = new ChatMessage({
          workspaceId: data.workspaceId,
          userId,
          text: data.text,
        });
        await message.save();
        const populated = await message.populate('userId', 'displayName email avatarUrl');

        // Broadcast to entire room including sender
        io.to(data.workspaceId).emit('chat:message', populated);
      } catch (err) {
        console.error('Chat message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userInfo = onlineUsers.get(socket.id);
      if (userInfo) {
        socket.to(userInfo.workspaceId).emit('user:disconnected', { userId });
        socket.to(userInfo.workspaceId).emit('cursor:remove', { userId });
        onlineUsers.delete(socket.id);
        userCursors.delete(socket.id);
      }
      console.log(`❌ User disconnected: ${displayName} (${socket.id})`);
    });
  });
}

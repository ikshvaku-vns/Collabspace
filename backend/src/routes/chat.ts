import { Router, Response } from 'express';
import ChatMessage from '../models/ChatMessage';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/chat/:workspaceId — get last 50 messages
router.get('/:workspaceId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await ChatMessage.find({ workspaceId: req.params.workspaceId })
      .populate('userId', 'displayName email avatarUrl')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

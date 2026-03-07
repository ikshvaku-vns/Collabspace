import { Router, Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/activity/:workspaceId — get activity logs
router.get('/:workspaceId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const logs = await ActivityLog.find({ workspaceId: req.params.workspaceId })
      .populate('actorId', 'displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ logs });
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/activity — get all activity across user's workspaces
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const Workspace = (await import('../models/Workspace')).default;
    const workspaces = await Workspace.find({
      $or: [{ ownerId: req.userId }, { memberIds: req.userId }],
    }).select('_id');

    const workspaceIds = workspaces.map(w => w._id);
    const logs = await ActivityLog.find({ workspaceId: { $in: workspaceIds } })
      .populate('actorId', 'displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ logs });
  } catch (err) {
    console.error('Get all activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

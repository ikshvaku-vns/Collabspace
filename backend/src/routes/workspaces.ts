import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Workspace from '../models/Workspace';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/workspaces — list user's workspaces
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ ownerId: req.userId }, { memberIds: req.userId }],
    })
      .populate('ownerId', 'displayName email avatarUrl')
      .populate('memberIds', 'displayName email avatarUrl')
      .sort({ lastActiveAt: -1 });

    res.json({ workspaces });
  } catch (err) {
    console.error('List workspaces error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/workspaces — create workspace
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Workspace name is required' });
      return;
    }

    const workspace = new Workspace({
      name,
      description: description || '',
      ownerId: req.userId,
      memberIds: [req.userId],
      inviteToken: uuidv4(),
    });
    await workspace.save();

    await ActivityLog.create({
      workspaceId: workspace._id,
      actorId: req.userId,
      action: 'created',
      entityType: 'workspace',
      entityTitle: name,
    });

    const populated = await workspace.populate([
      { path: 'ownerId', select: 'displayName email avatarUrl' },
      { path: 'memberIds', select: 'displayName email avatarUrl' },
    ]);

    res.status(201).json({ workspace: populated });
  } catch (err) {
    console.error('Create workspace error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/workspaces/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('ownerId', 'displayName email avatarUrl')
      .populate('memberIds', 'displayName email avatarUrl');

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json({ workspace });
  } catch (err) {
    console.error('Get workspace error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workspaces/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { name, description, lastActiveAt: new Date() },
      { new: true }
    )
      .populate('ownerId', 'displayName email avatarUrl')
      .populate('memberIds', 'displayName email avatarUrl');

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found or access denied' });
      return;
    }

    res.json({ workspace });
  } catch (err) {
    console.error('Update workspace error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/workspaces/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found or access denied' });
      return;
    }
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    console.error('Delete workspace error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/workspaces/join/:inviteToken — join via invite link
router.post('/join/:inviteToken', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findOne({ inviteToken: req.params.inviteToken });
    if (!workspace) {
      res.status(404).json({ error: 'Invalid invite link' });
      return;
    }

    const userId = req.userId!;
    if (!workspace.memberIds.map(id => id.toString()).includes(userId)) {
      workspace.memberIds.push(userId as any);
      workspace.lastActiveAt = new Date();
      await workspace.save();

      await ActivityLog.create({
        workspaceId: workspace._id,
        actorId: req.userId,
        action: 'joined',
        entityType: 'workspace',
        entityTitle: workspace.name,
      });
    }

    const populated = await workspace.populate([
      { path: 'ownerId', select: 'displayName email avatarUrl' },
      { path: 'memberIds', select: 'displayName email avatarUrl' },
    ]);

    res.json({ workspace: populated });
  } catch (err) {
    console.error('Join workspace error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

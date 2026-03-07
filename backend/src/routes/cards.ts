import { Router, Response } from 'express';
import Card from '../models/Card';
import Workspace from '../models/Workspace';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/cards/:workspaceId — get all cards for a workspace
router.get('/:workspaceId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cards = await Card.find({ workspaceId: req.params.workspaceId })
      .populate('assigneeId', 'displayName email avatarUrl')
      .populate('createdBy', 'displayName email avatarUrl')
      .sort({ order: 1, createdAt: -1 });

    res.json({ cards });
  } catch (err) {
    console.error('Get cards error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/cards — create a new card
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId, title, description, column } = req.body;
    if (!workspaceId || !title) {
      res.status(400).json({ error: 'workspaceId and title are required' });
      return;
    }

    // Get the max order for the column
    const maxOrderCard = await Card.findOne({ workspaceId, column: column || 'todo' }).sort({ order: -1 });
    const order = maxOrderCard ? maxOrderCard.order + 1 : 0;

    const card = new Card({
      workspaceId,
      title,
      description: description || '',
      column: column || 'todo',
      order,
      createdBy: req.userId,
    });
    await card.save();

    // Update workspace lastActiveAt
    await Workspace.findByIdAndUpdate(workspaceId, { lastActiveAt: new Date() });

    await ActivityLog.create({
      workspaceId,
      actorId: req.userId,
      action: 'created',
      entityType: 'card',
      entityTitle: title,
      entityId: card._id,
    });

    const populated = await card.populate([
      { path: 'assigneeId', select: 'displayName email avatarUrl' },
      { path: 'createdBy', select: 'displayName email avatarUrl' },
    ]);

    res.status(201).json({ card: populated });
  } catch (err) {
    console.error('Create card error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/cards/:id — update a card
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, column, order, assigneeId } = req.body;

    const card = await Card.findById(req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const oldColumn = card.column;
    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (column !== undefined) card.column = column;
    if (order !== undefined) card.order = order;
    if (assigneeId !== undefined) card.assigneeId = assigneeId;

    await card.save();
    await Workspace.findByIdAndUpdate(card.workspaceId, { lastActiveAt: new Date() });

    if (column && column !== oldColumn) {
      await ActivityLog.create({
        workspaceId: card.workspaceId,
        actorId: req.userId,
        action: `moved to ${column}`,
        entityType: 'card',
        entityTitle: card.title,
        entityId: card._id,
      });
    }

    const populated = await card.populate([
      { path: 'assigneeId', select: 'displayName email avatarUrl' },
      { path: 'createdBy', select: 'displayName email avatarUrl' },
    ]);

    res.json({ card: populated });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/cards/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    await ActivityLog.create({
      workspaceId: card.workspaceId,
      actorId: req.userId,
      action: 'deleted',
      entityType: 'card',
      entityTitle: card.title,
    });

    res.json({ message: 'Card deleted' });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/cards/:id/move — move card between columns
router.patch('/:id/move', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { column, order } = req.body;
    if (!column) {
      res.status(400).json({ error: 'column is required' });
      return;
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const oldColumn = card.column;
    card.column = column;
    if (order !== undefined) card.order = order;
    await card.save();

    await Workspace.findByIdAndUpdate(card.workspaceId, { lastActiveAt: new Date() });

    if (column !== oldColumn) {
      await ActivityLog.create({
        workspaceId: card.workspaceId,
        actorId: req.userId,
        action: `moved to ${column}`,
        entityType: 'card',
        entityTitle: card.title,
        entityId: card._id,
      });
    }

    const populated = await card.populate([
      { path: 'assigneeId', select: 'displayName email avatarUrl' },
      { path: 'createdBy', select: 'displayName email avatarUrl' },
    ]);

    res.json({ card: populated });
  } catch (err) {
    console.error('Move card error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

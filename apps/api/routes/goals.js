const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const authenticate = require('../middleware/authenticate')
const isMember = require('../middleware/isMember')
const checkPermission = require('../middleware/checkPermission')
const { can } = require('../lib/permissions')

router.use(authenticate, isMember)
// GET /api/workspaces/:workspaceId/goals
router.get('/', async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
        _count: { select: { actionItems: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ goals })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/goals
router.post('/', checkPermission('goal:create'), async (req, res) => {
  try {
    const { title, description, dueDate } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: req.userId,
        workspaceId: req.params.workspaceId
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
        _count: { select: { actionItems: true } }
      }
    })

    // audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Goal',
        entityId: goal.id,
        userId: req.userId,
        workspaceId: req.params.workspaceId
      }
    })

    res.status(201).json({ goal })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/workspaces/:workspaceId/goals/:id
router.get('/:id', async (req, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, workspaceId: req.params.workspaceId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
        updates: { orderBy: { createdAt: 'desc' } },
        actionItems: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } }
          }
        }
      }
    })
    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    res.json({ goal })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/workspaces/:workspaceId/goals/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, workspaceId: req.params.workspaceId }
    })
    if (!goal) return res.status(404).json({ error: 'Goal not found' })

    // only owner or admin can update
    if (goal.ownerId !== req.userId && req.member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
        _count: { select: { actionItems: true } }
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Goal',
        entityId: goal.id,
        userId: req.userId,
        workspaceId: req.params.workspaceId,
        meta: { changes: req.body }
      }
    })

    res.json({ goal: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/workspaces/:workspaceId/goals/:id
router.delete('/:id', async (req, res) => {
  try {
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, workspaceId: req.params.workspaceId } })
    if (!goal) return res.status(404).json({ error: 'Not found' })

    const isOwner = goal.ownerId === req.userId
    const canDeleteAny = can(req.member.role, 'goal:delete_any')
    const canDeleteOwn = can(req.member.role, 'goal:delete_own') && isOwner

    if (!canDeleteAny && !canDeleteOwn) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    await prisma.goal.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/goals/:id/milestones
router.post('/:id/milestones', checkPermission('milestone:create'), async (req, res) => {
  try {
    const { title, progress = 0 } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const milestone = await prisma.milestone.create({
      data: { title, progress, goalId: req.params.id }
    })
    res.status(201).json({ milestone })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/workspaces/:workspaceId/goals/:id/milestones/:mId
router.patch('/:id/milestones/:mId', checkPermission('milestone:update'), async (req, res) => {
  try {
    const { title, progress } = req.body
    const milestone = await prisma.milestone.update({
      where: { id: req.params.mId },
      data: {
        ...(title && { title }),
        ...(progress !== undefined && { progress: parseInt(progress) })
      }
    })
    res.json({ milestone })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/goals/:id/updates
router.post('/:id/updates', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    const update = await prisma.goalUpdate.create({
      data: { content, goalId: req.params.id }
    })
    res.status(201).json({ update })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

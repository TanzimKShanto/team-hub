const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const authenticate = require('../middleware/authenticate')
const isMember = require('../middleware/isMember')

router.use(authenticate, isMember)

// GET /api/workspaces/:workspaceId/action-items
router.get('/', async (req, res) => {
  try {
    const { status, assigneeId, goalId } = req.query

    const items = await prisma.actionItem.findMany({
      where: {
        workspaceId: req.params.workspaceId,
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
        ...(goalId && { goalId })
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        goal: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/action-items
router.post('/', async (req, res) => {
  try {
    const { title, assigneeId, priority, dueDate, goalId } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const item = await prisma.actionItem.create({
      data: {
        title,
        assigneeId: assigneeId || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        goalId: goalId || null,
        workspaceId: req.params.workspaceId
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        goal: { select: { id: true, title: true } }
      }
    })
    res.status(201).json({ item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/workspaces/:workspaceId/action-items/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, status, priority, assigneeId, dueDate, goalId } = req.body

    const item = await prisma.actionItem.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(goalId !== undefined && { goalId: goalId || null })
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        goal: { select: { id: true, title: true } }
      }
    })
    res.json({ item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/workspaces/:workspaceId/action-items/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.actionItem.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

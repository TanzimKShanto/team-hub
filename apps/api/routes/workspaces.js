const router = require('express').Router()
const prisma = require('../lib/prisma')
const authenticate = require('../middleware/authenticate')
const isMember = require('../middleware/isMember')
const { can, PERMISSIONS } = require('../lib/permissions')
const checkPermission = require('../middleware/checkPermission')

// all workspace routes require auth
router.use(authenticate)

// GET /api/workspaces/:workspaceId/permissions
router.get('/:workspaceId/permissions', isMember, async (req, res) => {
  const role = req.member.role
  res.json({
    role,
    permissions: PERMISSIONS[role]
  })
})

// GET /api/workspaces — list user's workspaces
router.get('/', async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.userId },
      include: {
        workspace: true
      },
      orderBy: { joinedAt: 'asc' }
    })

    const workspaces = memberships.map(m => ({
      ...m.workspace,
      role: m.role
    }))

    res.json({ workspaces })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces — create workspace
router.post('/', async (req, res) => {
  try {
    const { name, description, accentColor } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        accentColor: accentColor || '#6366f1',
        members: {
          create: {
            userId: req.userId,
            role: 'ADMIN'
          }
        }
      }
    })

    res.status(201).json({ workspace: { ...workspace, role: 'ADMIN' } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/workspaces/:workspaceId — get workspace details
router.get('/:workspaceId', isMember, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    res.json({
      workspace: {
        ...workspace,
        role: req.member.role
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/workspaces/:workspaceId — update workspace
router.patch('/:workspaceId', isMember, checkPermission('workspace:update'), async (req, res) => {
  try {
    const { name, description, accentColor } = req.body

    const workspace = await prisma.workspace.update({
      where: { id: req.params.workspaceId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(accentColor && { accentColor })
      }
    })

    res.json({ workspace })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/invite — invite member by email
router.post('/:workspaceId/invite', isMember, checkPermission('workspace:invite'), async (req, res) => {
  try {
    const { email, role = 'MEMBER' } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const invitee = await prisma.user.findUnique({ where: { email } })
    if (!invitee) return res.status(404).json({ error: 'No user found with that email' })

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitee.id,
          workspaceId: req.params.workspaceId
        }
      }
    })
    if (existing) return res.status(409).json({ error: 'User is already a member' })

    const membership = await prisma.workspaceMember.create({
      data: {
        userId: invitee.id,
        workspaceId: req.params.workspaceId,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    res.status(201).json({ member: { ...membership.user, role: membership.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/workspaces/:workspaceId/members/:userId — change role
router.patch('/:workspaceId/members/:userId', isMember, checkPermission('workspace:change_role'), async (req, res) => {
  try {
    const { role } = req.body
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const updated = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: req.params.userId,
          workspaceId: req.params.workspaceId
        }
      },
      data: { role }
    })

    res.json({ member: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/workspaces/:workspaceId/members/:userId — remove member
router.delete('/:workspaceId/members/:userId', isMember, checkPermission('workspace:remove_member'), async (req, res) => {
  try {
    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: req.params.userId,
          workspaceId: req.params.workspaceId
        }
      }
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

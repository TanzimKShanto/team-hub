const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const authenticate = require('../middleware/authenticate')
const isMember = require('../middleware/isMember')
const checkPermission = require('../middleware/checkPermission')

router.use(authenticate, isMember)

// GET /api/workspaces/:workspaceId/announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: true
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })
    res.json({ announcements })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/announcements — Admin only
router.post('/', checkPermission('announcement:create'), async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    const announcement = await prisma.announcement.create({
      data: {
        content,
        authorId: req.userId,
        workspaceId: req.params.workspaceId
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: [],
        reactions: []
      }
    })

    // emit real-time event
    const io = req.app.get('io')
    io.to(req.params.workspaceId).emit('announcement:new', announcement)

    res.status(201).json({ announcement })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/workspaces/:workspaceId/announcements/:id/pin — Admin only
router.patch('/:id/pin', checkPermission('announcement:pin'), async (req, res) => {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { isPinned: !existing.isPinned }
    })

    const io = req.app.get('io')
    io.to(req.params.workspaceId).emit('announcement:pin', {
      id: req.params.id,
      isPinned: announcement.isPinned
    })

    res.json({ announcement })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/announcements/:id/reactions
router.post('/:id/reactions', async (req, res) => {
  try {
    const { emoji } = req.body
    if (!emoji) return res.status(400).json({ error: 'Emoji is required' })

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_announcementId_emoji: {
          userId: req.userId,
          announcementId: req.params.id,
          emoji
        }
      }
    })

    let reaction
    let removed = false

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      removed = true
    } else {
      reaction = await prisma.reaction.create({
        data: { emoji, userId: req.userId, announcementId: req.params.id }
      })
    }

    const io = req.app.get('io')
    io.to(req.params.workspaceId).emit('reaction:update', {
      announcementId: req.params.id,
      emoji,
      userId: req.userId,
      removed
    })

    res.json({ removed, reaction: removed ? null : reaction })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces/:workspaceId/announcements/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.userId,
        announcementId: req.params.id
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } }
      }
    })

    // parse @user_{id} mentions — create notifications
    const mentionMatches = [...content.matchAll(/@user_(\w+)/g)].map(m => m[1])
    if (mentionMatches.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          id: { in: mentionMatches, not: req.userId }
        }
      })

      if (mentionedUsers.length > 0) {
        await prisma.notification.createMany({
          data: mentionedUsers.map(u => ({
            userId: u.id,
            content: `You were mentioned in a comment`,
            commentId: comment.id
          }))
        })

        const io = req.app.get('io')
        const now = new Date()
        mentionedUsers.forEach(u => {
          io.to(`user:${u.id}`).emit('notification:new', {
            content: `You were mentioned in a comment`,
            createdAt: now.toISOString()
          })
        })
      }
    }

    const io = req.app.get('io')
    io.to(req.params.workspaceId).emit('comment:new', {
      announcementId: req.params.id,
      comment
    })

    res.status(201).json({ comment })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

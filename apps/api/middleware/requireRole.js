const prisma = require('../lib/prisma')

const requireRole = (...roles) => async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' })

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.userId,
          workspaceId
        }
      }
    })

    if (!member) return res.status(403).json({ error: 'Not a member of this workspace' })
    if (!roles.includes(member.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    req.member = member
    next()
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = requireRole

const prisma = require('../lib/prisma')

const isMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.userId,
          workspaceId
        }
      }
    })

    if (!member) return res.status(403).json({ error: 'Not a member of this workspace' })

    req.member = member
    next()
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = isMember

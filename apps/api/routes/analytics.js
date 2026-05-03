const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const authenticate = require('../middleware/authenticate')
const isMember = require('../middleware/isMember')

router.use(authenticate, isMember)

// GET /api/workspaces/:workspaceId/analytics
router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.params

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const [
      totalGoals,
      completedThisWeek,
      overdueGoals,
      totalItems,
      completedItems,
      goalsByStatus,
      recentActivity
    ] = await Promise.all([
      prisma.goal.count({ where: { workspaceId } }),

      prisma.goal.count({
        where: {
          workspaceId,
          status: 'COMPLETED',
          updatedAt: { gte: startOfWeek }
        }
      }),

      prisma.goal.count({
        where: {
          workspaceId,
          status: { not: 'COMPLETED' },
          dueDate: { lt: now }
        }
      }),

      prisma.actionItem.count({ where: { workspaceId } }),

      prisma.actionItem.count({
        where: { workspaceId, status: 'DONE' }
      }),

      prisma.goal.groupBy({
        by: ['status'],
        where: { workspaceId },
        _count: true
      }),

      // last 7 days goal completions for chart
      prisma.goal.findMany({
        where: {
          workspaceId,
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: { updatedAt: true }
      })
    ])

    // build chart data — last 7 days
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const label = date.toLocaleDateString('en', { weekday: 'short' })
      const count = recentActivity.filter(g => {
        const d = new Date(g.updatedAt)
        return d.toDateString() === date.toDateString()
      }).length
      return { day: label, completed: count }
    })

    const statusChart = goalsByStatus.map(g => ({
      status: g.status,
      count: g._count
    }))

    res.json({
      stats: {
        totalGoals,
        completedThisWeek,
        overdueGoals,
        totalItems,
        completedItems,
        completionRate: totalItems > 0
          ? Math.round((completedItems / totalItems) * 100)
          : 0
      },
      chartData,
      statusChart
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/workspaces/:workspaceId/analytics/export
router.get('/export', async (req, res) => {
  try {
    const { workspaceId } = req.params

    const [goals, items] = await Promise.all([
      prisma.goal.findMany({
        where: { workspaceId },
        include: {
          owner: { select: { name: true } },
          milestones: true
        }
      }),
      prisma.actionItem.findMany({
        where: { workspaceId },
        include: {
          assignee: { select: { name: true } },
          goal: { select: { title: true } }
        }
      })
    ])

    const goalRows = goals.map(g => [
      g.id, g.title, g.status,
      g.owner?.name || '',
      g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '',
      g.milestones.length,
      new Date(g.createdAt).toLocaleDateString()
    ])

    const itemRows = items.map(i => [
      i.id, i.title, i.status, i.priority,
      i.assignee?.name || '',
      i.goal?.title || '',
      i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '',
      new Date(i.createdAt).toLocaleDateString()
    ])

    const goalsCsv = [
      ['ID', 'Title', 'Status', 'Owner', 'Due Date', 'Milestones', 'Created'],
      ...goalRows
    ].map(r => r.join(',')).join('\n')

    const itemsCsv = [
      ['ID', 'Title', 'Status', 'Priority', 'Assignee', 'Goal', 'Due Date', 'Created'],
      ...itemRows
    ].map(r => r.join(',')).join('\n')

    const csv = `GOALS\n${goalsCsv}\n\nACTION ITEMS\n${itemsCsv}`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="workspace-export.csv"')
    res.send(csv)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

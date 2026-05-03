require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const http = require('http')
const { Server } = require('socket.io')

const authRoutes = require('./routes/auth')
const workspaceRoutes = require('./routes/workspaces')
const goalRoutes = require('./routes/goals')
const actionItemRoutes = require('./routes/actionItems')
const announcementRoutes = require('./routes/announcements')
const analyticsRoutes = require('./routes/analytics')
const profileRoutes = require('./routes/profile')
const notificationRoutes = require('./routes/notifications')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
})

// make io available in routes via req.app.get('io')
app.set('io', io)

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/workspaces', workspaceRoutes)
app.use('/api/workspaces/:workspaceId/goals', goalRoutes)
app.use('/api/workspaces/:workspaceId/action-items', actionItemRoutes)
app.use('/api/workspaces/:workspaceId/announcements', announcementRoutes)
app.use('/api/workspaces/:workspaceId/analytics', analyticsRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Socket.io connection handling
const onlineUsers = new Map() // workspaceId -> Set of userIds

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  // join workspace room
  socket.on('join:workspace', ({ workspaceId, userId }) => {
    socket.join(workspaceId)
    socket.join(`user:${userId}`) // personal room for notifications
    socket.data.userId = userId
    socket.data.workspaceId = workspaceId

    // track online presence
    if (!onlineUsers.has(workspaceId)) {
      onlineUsers.set(workspaceId, new Set())
    }
    onlineUsers.get(workspaceId).add(userId)

    io.to(workspaceId).emit('presence:update', {
      onlineUserIds: [...onlineUsers.get(workspaceId)]
    })
  })

  socket.on('disconnect', () => {
    const { userId, workspaceId } = socket.data
    if (workspaceId && userId) {
      onlineUsers.get(workspaceId)?.delete(userId)
      io.to(workspaceId).emit('presence:update', {
        onlineUserIds: [...(onlineUsers.get(workspaceId) || [])]
      })
    }
    console.log('Socket disconnected:', socket.id)
  })
})

server.listen(4000, () => console.log('API running on port 4000'))

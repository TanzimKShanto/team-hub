const router = require('express').Router()
const prisma = require('../lib/prisma')
const authenticate = require('../middleware/authenticate')
const { upload } = require('../lib/cloudinary')
const bcrypt = require('bcryptjs')

router.use(authenticate)

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/profile
router.patch('/', async (req, res) => {
  try {
    const { name } = req.body
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { ...(name && { name }) },
      select: { id: true, name: true, email: true, avatar: true }
    })
    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/profile/avatar
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: req.file.path },
      select: { id: true, name: true, email: true, avatar: true }
    })
    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/profile/password
router.patch('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both fields required' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' })

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed }
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

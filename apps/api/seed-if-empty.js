require('dotenv').config()
const { execFileSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
})

async function main() {
  const userCount = await prisma.user.count()
  await prisma.$disconnect()

  if (userCount > 0) {
    console.log(`[seed] ${userCount} user(s) already exist — skipping seed.`)
    return
  }

  console.log('[seed] Empty database detected — running seed...')
  execFileSync('node', ['seed.js'], { stdio: 'inherit', cwd: __dirname })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

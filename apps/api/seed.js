require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.reaction.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.actionItem.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.goalUpdate.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.workspaceMember.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPassword = await bcrypt.hash('demo1234', 12)
  const memberPassword = await bcrypt.hash('demo1234', 12)

  const admin = await prisma.user.create({
    data: {
      name: 'Alex Admin',
      email: 'admin@demo.com',
      password: adminPassword
    }
  })

  const member = await prisma.user.create({
    data: {
      name: 'Sam Member',
      email: 'member@demo.com',
      password: memberPassword
    }
  })

  console.log('✅ Users created')

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'FredoCloud Demo',
      description: 'A demo workspace to showcase Team Hub features',
      accentColor: '#6366f1',
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' }
        ]
      }
    }
  })

  console.log('✅ Workspace created')

  // Create goals
  const goal1 = await prisma.goal.create({
    data: {
      title: 'Launch v2.0 Product',
      description: 'Ship the new version with all core features complete',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      ownerId: admin.id,
      workspaceId: workspace.id,
      milestones: {
        create: [
          { title: 'Backend API complete', progress: 90 },
          { title: 'Frontend pages done', progress: 75 },
          { title: 'Deployment configured', progress: 40 },
          { title: 'Demo data seeded', progress: 100 }
        ]
      },
      updates: {
        create: [
          { content: 'Backend routes are all done, moving to frontend now.' },
          { content: 'Great progress this week — deployment next!' }
        ]
      }
    }
  })

  const goal2 = await prisma.goal.create({
    data: {
      title: 'Onboard 10 Beta Users',
      description: 'Get real users testing the platform and collecting feedback',
      status: 'NOT_STARTED',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: member.id,
      workspaceId: workspace.id,
      milestones: {
        create: [
          { title: 'Identify target users', progress: 50 },
          { title: 'Send invites', progress: 0 },
          { title: 'Collect feedback', progress: 0 }
        ]
      }
    }
  })

  const goal3 = await prisma.goal.create({
    data: {
      title: 'Set Up CI/CD Pipeline',
      description: 'Automate testing and deployment on every push',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ownerId: admin.id,
      workspaceId: workspace.id,
      milestones: {
        create: [
          { title: 'GitHub Actions configured', progress: 100 },
          { title: 'Railway auto-deploy enabled', progress: 100 }
        ]
      }
    }
  })

  console.log('✅ Goals created')

  // Create action items
  await prisma.actionItem.createMany({
    data: [
      {
        title: 'Write API documentation',
        status: 'TODO',
        priority: 'HIGH',
        assigneeId: admin.id,
        goalId: goal1.id,
        workspaceId: workspace.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Design onboarding flow',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        assigneeId: member.id,
        goalId: goal1.id,
        workspaceId: workspace.id
      },
      {
        title: 'Fix login page on mobile',
        status: 'DONE',
        priority: 'HIGH',
        assigneeId: admin.id,
        workspaceId: workspace.id
      },
      {
        title: 'Set up error monitoring',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: admin.id,
        goalId: goal1.id,
        workspaceId: workspace.id
      },
      {
        title: 'Draft beta user emails',
        status: 'TODO',
        priority: 'LOW',
        assigneeId: member.id,
        goalId: goal2.id,
        workspaceId: workspace.id
      },
      {
        title: 'Review pull requests',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: admin.id,
        workspaceId: workspace.id
      }
    ]
  })

  console.log('✅ Action items created')

  // Create announcements
  const ann1 = await prisma.announcement.create({
    data: {
      content: '🚀 Welcome to Team Hub! This is your collaborative workspace. Use Goals to track big objectives, Action Items for day-to-day tasks, and Announcements to keep the team informed.',
      isPinned: true,
      authorId: admin.id,
      workspaceId: workspace.id
    }
  })

  const ann2 = await prisma.announcement.create({
    data: {
      content: '📦 v2.0 is on track! Backend is 90% done, frontend pages are coming together. Aiming to deploy by end of next week. Great work everyone 🎉',
      isPinned: false,
      authorId: admin.id,
      workspaceId: workspace.id
    }
  })

  // Add reactions
  await prisma.reaction.createMany({
    data: [
      { emoji: '🎉', userId: member.id, announcementId: ann2.id },
      { emoji: '🔥', userId: admin.id, announcementId: ann2.id },
      { emoji: '👍', userId: member.id, announcementId: ann1.id }
    ]
  })

  // Add comment
  await prisma.comment.create({
    data: {
      content: 'Super excited about this! @Alex when do we get access to the staging URL?',
      authorId: member.id,
      announcementId: ann2.id
    }
  })

  console.log('✅ Announcements created')

  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Demo accounts:')
  console.log('  Admin  → admin@demo.com  / demo1234')
  console.log('  Member → member@demo.com / demo1234')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

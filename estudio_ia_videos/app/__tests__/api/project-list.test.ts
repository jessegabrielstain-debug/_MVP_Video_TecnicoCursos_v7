process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'
const { PrismaClient } = require('@prisma/client')
const { GET } = require('@/app/api/projects/route')

const prisma = new PrismaClient()

describe('/api/projects', () => {
  const uniqueSuffix = Date.now()
  const userEmail = `project-list-${uniqueSuffix}@example.com`
  let userId: string
  const projectIds: string[] = []

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Project List Test User'
      }
    })
    userId = user.id

    for (let i = 0; i < 3; i++) {
      const project = await prisma.project.create({
        data: {
          name: `Project List API Test ${i + 1}`,
          status: 'COMPLETED',
          userId,
          originalFileName: `list-test-${i + 1}.pptx`,
          totalSlides: 1,
          slides: {
            create: [
              {
                title: `Slide ${i + 1}`,
                content: 'Conteúdo',
                slideNumber: 1,
                duration: 5
              }
            ]
          }
        }
      })
      projectIds.push(project.id)
    }
  })

  afterAll(async () => {
    if (projectIds.length) {
      await prisma.slide.deleteMany({
        where: { projectId: { in: projectIds } }
      }).catch(() => undefined)
      await prisma.project.deleteMany({
        where: { id: { in: projectIds } }
      }).catch(() => undefined)
    }

    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }

    await prisma.$disconnect()
  })

  it('lista projetos recentes com estatísticas básicas', async () => {
    const request = { url: 'http://localhost/api/projects' } as NextRequest
    const response = await GET(request)

    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.data.length).toBeGreaterThanOrEqual(3)

    const project = payload.data[0]
    expect(project).toHaveProperty('id')
    expect(project).toHaveProperty('totalSlides')
    expect(project).toHaveProperty('totalDuration')
  })

  it('respeita o parâmetro de limite', async () => {
    const request = { url: 'http://localhost/api/projects?limit=2' } as NextRequest
    const response = await GET(request)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.data.length).toBeLessThanOrEqual(2)
  })
})

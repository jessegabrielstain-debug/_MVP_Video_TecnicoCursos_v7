// @jest-environment node
import { NextRequest } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
import { GET } from '@/api/projects/[id]/route'

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'

const prisma = new PrismaClient()

describe('/api/projects/[id]', () => {
  const uniqueSuffix = Date.now()
  const userEmail = `project-details-${uniqueSuffix}@example.com`
  let userId: string
  let projectId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Project Details Test User'
      }
    })
    userId = user.id

    const pptxMetadata: Prisma.InputJsonValue = {
      title: 'Project Details API Test',
      author: 'Test Suite'
    }

    const project = await prisma.project.create({
      data: {
        name: 'Project Details API Test',
        status: 'COMPLETED',
        userId,
        originalFileName: 'details-test.pptx',
        totalSlides: 2,
        pptxMetadata,
        slides: {
          create: [
            {
              title: 'Introdução',
              content: 'Conteúdo introdutório',
              slideNumber: 1,
              duration: 4,
              backgroundType: 'solid',
              backgroundColor: '#ffffff'
            },
            {
              title: 'Resumo',
              content: 'Resumo final do conteúdo',
              slideNumber: 2,
              duration: 6,
              backgroundType: 'solid',
              backgroundColor: '#f9f9f9'
            }
          ]
        }
      }
    })

    projectId = project.id
  })

  afterAll(async () => {
    if (projectId) {
      await prisma.project.delete({ where: { id: projectId } }).catch(() => undefined)
    }

    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }

    await prisma.$disconnect()
  })

  it('retorna detalhes do projeto com timeline e slides', async () => {
    const request = new NextRequest(`http://localhost/api/projects/${projectId}`)

    const response = await GET(request, { params: { id: projectId } })
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.data.id).toBe(projectId)
    expect(payload.data.slides).toHaveLength(2)
    expect(payload.data.timeline).toHaveLength(2)
    expect(payload.data.stats.totalDuration).toBeGreaterThan(0)
  })

  it('retorna 404 para projetos inexistentes', async () => {
    const fakeId = 'non-existing-project-id'
    const request = new NextRequest(`http://localhost/api/projects/${fakeId}`)

    const response = await GET(request, { params: { id: fakeId } })
    expect(response.status).toBe(404)
  })
})

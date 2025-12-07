import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { POST } from '@/app/api/pptx/upload/route'

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue(null)
}))

const FIXTURE_PATH = path.join(process.cwd(), 'test-presentation.pptx')

const prisma = new PrismaClient()

describe('/api/pptx/upload', () => {
  jest.setTimeout(20000)

  it('salva o arquivo, cria projeto e gera slides', async () => {
    const buffer = await fs.readFile(FIXTURE_PATH)

    const file = new File([buffer], 'with-metadata.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    })

    const fakeFormData = {
      get: (field) => {
        if (field === 'file') return file
        if (field === 'projectName') return file.name.replace(/\.pptx$/i, '')
        return null
      }
    }

    const request = {
      formData: async () => fakeFormData,
      headers: new Headers({ 'content-type': 'multipart/form-data' })
    }

    const response = await POST(request as unknown as NextRequest)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.projectId).toBeDefined()
    expect(payload.data.totalSlides).toBeGreaterThan(0)

    const { projectId, totalSlides, pptxUrl } = payload.data

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { slides: true }
    })

    expect(project).not.toBeNull()
    expect(project?.slides.length).toBe(totalSlides)
    expect(project?.pptxUrl).toBe(pptxUrl)
    expect(project?.status).toBe('COMPLETED')

    const storedPath = path.join(process.cwd(), 'public', pptxUrl.replace(/^\//, ''))
    const exists = await fs
      .stat(storedPath)
      .then(() => true)
      .catch(() => false)

    expect(exists).toBe(true)

    await prisma.slide.deleteMany({ where: { projectId } })
    await prisma.project.delete({ where: { id: projectId } })
    await fs.unlink(storedPath)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })
})

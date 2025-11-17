
import { NextRequest, NextResponse } from 'next/server'

interface RenderJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startTime: Date
  estimatedTime?: number
  outputFormat: string
  quality: string
  resolution: string
  fileSize?: number
  settings?: Record<string, unknown>
}

// In-memory storage for demo (use database in production)
let renderJobs: RenderJob[] = [
  {
    id: 'job-1',
    name: 'Treinamento NR-12 - Segurança com Máquinas',
    status: 'processing',
    progress: 67,
    startTime: new Date(Date.now() - 5 * 60 * 1000),
    estimatedTime: 8,
    outputFormat: 'MP4',
    quality: 'High',
    resolution: '1080p'
  },
  {
    id: 'job-2',
    name: 'Tutorial Avatar 3D - Narração Corporativa',
    status: 'completed',
    progress: 100,
    startTime: new Date(Date.now() - 20 * 60 * 1000),
    outputFormat: 'MP4',
    quality: 'Ultra',
    resolution: '4K',
    fileSize: 2.4
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')

    let filteredJobs = [...renderJobs]

    if (jobId) {
      filteredJobs = renderJobs.filter(job => job.id === jobId)
      if (filteredJobs.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Job não encontrado' },
          { status: 404 }
        )
      }
    }

    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status)
    }

    // Update progress for processing jobs
    filteredJobs = filteredJobs.map(job => {
      if (job.status === 'processing' && job.progress < 100) {
        const newProgress = Math.min(100, job.progress + Math.random() * 5)
        return { ...job, progress: newProgress }
      }
      return job
    })

    return NextResponse.json({
      success: true,
      data: filteredJobs,
      total: filteredJobs.length
    })
  } catch (error) {
    console.error('Render jobs GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar jobs de renderização' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, settings } = body

    const newJob: RenderJob = {
      id: `job_${Date.now()}`,
      name: name || `Render Job - ${new Date().toLocaleTimeString('pt-BR')}`,
      status: 'processing',
      progress: 0,
      startTime: new Date(),
      estimatedTime: Math.floor(Math.random() * 10) + 5,
      outputFormat: settings?.format?.toUpperCase() || 'MP4',
      quality: settings?.quality || 'High',
      resolution: settings?.resolution || '1080p',
      settings
    }

    renderJobs.unshift(newJob)

    // Simulate render progress
    const progressInterval = setInterval(() => {
      const jobIndex = renderJobs.findIndex(job => job.id === newJob.id)
      if (jobIndex === -1) {
        clearInterval(progressInterval)
        return
      }

      const job = renderJobs[jobIndex]
      if (job.status !== 'processing') {
        clearInterval(progressInterval)
        return
      }

      job.progress = Math.min(100, job.progress + Math.random() * 3)
      
      if (job.progress >= 100) {
        job.status = 'completed'
        job.fileSize = Math.random() * 3 + 1
        clearInterval(progressInterval)
      }
    }, 2000)

    return NextResponse.json({
      success: true,
      data: newJob,
      message: 'Job de renderização iniciado com sucesso'
    })
  } catch (error) {
    console.error('Render job POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao iniciar renderização' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { jobId, action } = await request.json()

    if (!jobId || !action) {
      return NextResponse.json(
        { success: false, error: 'JobId e action são obrigatórios' },
        { status: 400 }
      )
    }

    const jobIndex = renderJobs.findIndex(job => job.id === jobId)
    if (jobIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Job não encontrado' },
        { status: 404 }
      )
    }

    const job = renderJobs[jobIndex]

    switch (action) {
      case 'cancel':
        if (job.status === 'processing' || job.status === 'pending') {
          job.status = 'cancelled'
        }
        break
      case 'restart':
        if (job.status === 'failed' || job.status === 'cancelled') {
          job.status = 'processing'
          job.progress = 0
          job.startTime = new Date()
        }
        break
      case 'pause':
        if (job.status === 'processing') {
          job.status = 'pending'
        }
        break
      case 'resume':
        if (job.status === 'pending') {
          job.status = 'processing'
        }
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: job,
      message: `Job ${action} executado com sucesso`
    })
  } catch (error) {
    console.error('Render job PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar job' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'JobId é obrigatório' },
        { status: 400 }
      )
    }

    const jobIndex = renderJobs.findIndex(job => job.id === jobId)
    if (jobIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Job não encontrado' },
        { status: 404 }
      )
    }

    const deletedJob = renderJobs.splice(jobIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: deletedJob,
      message: 'Job removido com sucesso'
    })
  } catch (error) {
    console.error('Render job DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao remover job' },
      { status: 500 }
    )
  }
}

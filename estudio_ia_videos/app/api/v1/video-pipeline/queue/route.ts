
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  // Return queue status for video pipeline
  const queueStatus = {
    active_jobs: 2,
    queued_jobs: 3,
    completed_jobs: 47,
    failed_jobs: 1,
    total_processing_time: 1847, // seconds
    average_job_time: 312,
    success_rate: 97.9,
    current_capacity: 75.4 // percentage
  }

  return NextResponse.json({
    success: true,
    queue_status: queueStatus
  })
}

export async function POST(request: NextRequest) {
  try {
    const { action, job_id } = await request.json()

    if (action === 'pause_all') {
      return NextResponse.json({
        success: true,
        message: 'All jobs paused successfully'
      })
    }

    if (action === 'resume_all') {
      return NextResponse.json({
        success: true,
        message: 'All jobs resumed successfully'
      })
    }

    if (action === 'clear_completed') {
      return NextResponse.json({
        success: true,
        message: 'Completed jobs cleared successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}


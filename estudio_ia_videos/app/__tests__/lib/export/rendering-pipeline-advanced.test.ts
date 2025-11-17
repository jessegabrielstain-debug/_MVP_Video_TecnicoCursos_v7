/**
 * Unit Tests for Rendering Pipeline - Sprint 51
 * Tests: Pause/Cancel/Resume + ETA Calculation
 * Focus: Test state management and control methods independently
 */

import { RenderingPipeline, PipelineState } from '@/lib/export/rendering-pipeline'

type RenderingPipelineInternals = RenderingPipeline & {
  state: PipelineState
  pausedAt?: number
  calculateETA: (stage: string, progress: number, totalStages: number, elapsedMs: number) => number
  calculateAverageStageTime: () => number
  checkPauseOrCancel: () => Promise<boolean>
}

const withInternals = (instance: RenderingPipeline): RenderingPipelineInternals => {
  return instance as unknown as RenderingPipelineInternals
}

describe('RenderingPipeline - State Management (Sprint 51)', () => {
  let pipeline: RenderingPipeline

  beforeEach(() => {
    pipeline = new RenderingPipeline()
  })

  describe('State Initialization', () => {
    test('should initialize with IDLE state', () => {
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
    })
  })

  describe('Pause Control', () => {
    test('should change state to PAUSED when pause() is called on RUNNING pipeline', () => {
      // Set to RUNNING first
      withInternals(pipeline).state = PipelineState.RUNNING
      
      pipeline.pause()
      expect(pipeline.getState()).toBe(PipelineState.PAUSED)
    })

    test('should not change state when pause() called on IDLE pipeline', () => {
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
      
      pipeline.pause()
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
    })

    test('should allow multiple pause() calls on RUNNING pipeline', () => {
      withInternals(pipeline).state = PipelineState.RUNNING
      
      pipeline.pause()
      expect(pipeline.getState()).toBe(PipelineState.PAUSED)
      
      pipeline.pause()
      expect(pipeline.getState()).toBe(PipelineState.PAUSED)
    })
  })

  describe('Resume Control', () => {
    test('should resume from PAUSED state', () => {
      // Set to PAUSED first
      const internals = withInternals(pipeline)
      internals.state = PipelineState.PAUSED
      internals.pausedAt = Date.now()
      
      pipeline.resume()
      expect(pipeline.getState()).toBe(PipelineState.RUNNING)
    })

    test('should not affect non-paused pipeline', () => {
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
      pipeline.resume()
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
    })
  })

  describe('Cancel Control', () => {
    test('should change state to CANCELLED when cancel() is called on RUNNING pipeline', () => {
      withInternals(pipeline).state = PipelineState.RUNNING
      
      pipeline.cancel()
      expect(pipeline.getState()).toBe(PipelineState.CANCELLED)
    })

    test('should allow cancel from PAUSED', () => {
      withInternals(pipeline).state = PipelineState.PAUSED
      
      pipeline.cancel()
      expect(pipeline.getState()).toBe(PipelineState.CANCELLED)
    })

    test('should not change IDLE state when cancel() called', () => {
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
      pipeline.cancel()
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
    })
  })

  describe('State Transitions', () => {
    test('should transition RUNNING → PAUSED → RUNNING → CANCELLED', () => {
      const internals = withInternals(pipeline)
      internals.state = PipelineState.RUNNING
      expect(pipeline.getState()).toBe(PipelineState.RUNNING)
      
      pipeline.pause()
      expect(pipeline.getState()).toBe(PipelineState.PAUSED)
      
      pipeline.resume()
      expect(pipeline.getState()).toBe(PipelineState.RUNNING)
      
      pipeline.cancel()
      expect(pipeline.getState()).toBe(PipelineState.CANCELLED)
    })

    test('should transition PAUSED → CANCELLED directly', () => {
      withInternals(pipeline).state = PipelineState.PAUSED
      
      pipeline.cancel()
      expect(pipeline.getState()).toBe(PipelineState.CANCELLED)
    })
  })

  describe('getState Method', () => {
    test('should return current state', () => {
      expect(pipeline.getState()).toBe(PipelineState.IDLE)
      
      withInternals(pipeline).state = PipelineState.RUNNING
      expect(pipeline.getState()).toBe(PipelineState.RUNNING)
      
      withInternals(pipeline).state = PipelineState.PAUSED
      expect(pipeline.getState()).toBe(PipelineState.PAUSED)
    })
  })
})

describe('RenderingPipeline - ETA Calculation (Sprint 51)', () => {
  let pipeline: RenderingPipeline

  beforeEach(() => {
    pipeline = new RenderingPipeline()
  })

  describe('calculateETA Method', () => {
    test('should have calculateETA method', () => {
      expect(typeof withInternals(pipeline).calculateETA).toBe('function')
    })

    test('should return number when called with valid arguments', () => {
      const eta = withInternals(pipeline).calculateETA('audio_processing', 0.5, 4, 0)
      expect(typeof eta).toBe('number')
      expect(eta).toBeGreaterThanOrEqual(0)
    })

    test('should calculate ETA based on current progress', () => {
      const eta = withInternals(pipeline).calculateETA('audio_processing', 0.75, 4, 0)
      expect(typeof eta).toBe('number')
      expect(eta).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateAverageStageTime Method', () => {
    test('should have calculateAverageStageTime method', () => {
      expect(typeof withInternals(pipeline).calculateAverageStageTime).toBe('function')
    })

    test('should return number when called', () => {
      const avgTime = withInternals(pipeline).calculateAverageStageTime()
      expect(typeof avgTime).toBe('number')
      expect(avgTime).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('RenderingPipeline - checkPauseOrCancel Method (Sprint 51)', () => {
  let pipeline: RenderingPipeline

  beforeEach(() => {
    pipeline = new RenderingPipeline()
  })

  test('should have checkPauseOrCancel method', () => {
    expect(typeof withInternals(pipeline).checkPauseOrCancel).toBe('function')
  })

  test('should return true when state is RUNNING', async () => {
    const internals = withInternals(pipeline)
    internals.state = PipelineState.RUNNING
    const result = await internals.checkPauseOrCancel()
    expect(result).toBe(true)
  })

  test('should return false when state is CANCELLED', async () => {
    const internals = withInternals(pipeline)
    internals.state = PipelineState.CANCELLED
    const result = await internals.checkPauseOrCancel()
    expect(result).toBe(false)
  })

  test('should wait while PAUSED and return true when resumed', async () => {
    const internals = withInternals(pipeline)
    internals.state = PipelineState.PAUSED
    
    // Resume after short delay
    setTimeout(() => {
      internals.state = PipelineState.RUNNING
    }, 100)
    
    const result = await internals.checkPauseOrCancel()
    expect(result).toBe(true)
  }, 500)
})

describe('RenderingPipeline - PipelineState Enum (Sprint 51)', () => {
  test('should have IDLE state', () => {
    expect(PipelineState.IDLE).toBe('idle')
  })

  test('should have RUNNING state', () => {
    expect(PipelineState.RUNNING).toBe('running')
  })

  test('should have PAUSED state', () => {
    expect(PipelineState.PAUSED).toBe('paused')
  })

  test('should have CANCELLED state', () => {
    expect(PipelineState.CANCELLED).toBe('cancelled')
  })

  test('should have COMPLETED state', () => {
    expect(PipelineState.COMPLETED).toBe('completed')
  })

  test('should have FAILED state', () => {
    expect(PipelineState.FAILED).toBe('failed')
  })
})


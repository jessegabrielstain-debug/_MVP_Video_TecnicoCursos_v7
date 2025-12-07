/**
 * Advanced Timeline System Tests
 * Valida funcionalidades do editor de vídeo profissional
 */

import { renderHook, act } from '@testing-library/react'
import { useTimelineStore } from '@/lib/stores/timeline-store'
import { TimelineProject, TimelineElement } from '@/lib/types/timeline-types'

describe('Advanced Timeline System', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { clearHistory, createNewProject } = useTimelineStore.getState()
    clearHistory()
    createNewProject('Test Project', 120)
  })

  describe('Project Management', () => {
    test('should create new project with correct structure', () => {
      const { result } = renderHook(() => useTimelineStore())
      
      act(() => {
        result.current.createNewProject('Advanced Video Project', 180)
      })

      expect(result.current.project).toBeTruthy()
      expect(result.current.project?.name).toBe('Advanced Video Project')
      expect(result.current.project?.duration).toBe(180)
      expect(result.current.project?.framerate).toBe(30)
      expect(result.current.project?.resolution).toEqual({ width: 1920, height: 1080 })
      expect(result.current.isProjectLoaded).toBe(true)
    })

    test('should save project with current state', async () => {
      const { result } = renderHook(() => useTimelineStore())
      
      // Mock fetch for save
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await act(async () => {
        await result.current.saveProject()
      })

      expect(fetch).toHaveBeenCalledWith('/api/v1/timeline/save', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }))
    })

    test('should duplicate project with new ID and name', () => {
      const { result } = renderHook(() => useTimelineStore())
      const originalProject = result.current.project

      act(() => {
        result.current.duplicateProject()
      })

      expect(result.current.project?.id).not.toBe(originalProject?.id)
      expect(result.current.project?.name).toBe(`${originalProject?.name} (Copy)`)
    })
  })

  describe('Playback Control', () => {
    test('should control playback state correctly', () => {
      const { result } = renderHook(() => useTimelineStore())

      expect(result.current.isPlaying).toBe(false)

      act(() => {
        result.current.play()
      })
      expect(result.current.isPlaying).toBe(true)

      act(() => {
        result.current.pause()
      })
      expect(result.current.isPlaying).toBe(false)

      act(() => {
        result.current.stop()
      })
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentTime).toBe(0)
    })

    test('should seek to valid time positions', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.seekTo(30)
      })
      expect(result.current.currentTime).toBe(30)

      // Should clamp to duration
      act(() => {
        result.current.seekTo(150)
      })
      expect(result.current.currentTime).toBe(120) // project duration

      // Should clamp to 0
      act(() => {
        result.current.seekTo(-10)
      })
      expect(result.current.currentTime).toBe(0)
    })

    test('should control volume within valid range', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.setVolume(0.5)
      })
      expect(result.current.volume).toBe(0.5)

      // Should clamp to max
      act(() => {
        result.current.setVolume(1.5)
      })
      expect(result.current.volume).toBe(1)

      // Should clamp to min
      act(() => {
        result.current.setVolume(-0.5)
      })
      expect(result.current.volume).toBe(0)
    })
  })

  describe('Timeline View Control', () => {
    test('should control zoom within valid range', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.setZoom(2)
      })
      expect(result.current.zoom).toBe(2)
      expect(result.current.pixelsPerSecond).toBe(200)

      // Should clamp to max
      act(() => {
        result.current.setZoom(15)
      })
      expect(result.current.zoom).toBe(10)

      // Should clamp to min
      act(() => {
        result.current.setZoom(0.05)
      })
      expect(result.current.zoom).toBe(0.1)
    })

    test('should control scroll position', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.setScrollX(500)
      })
      expect(result.current.scrollX).toBe(500)

      // Should not allow negative scroll
      act(() => {
        result.current.setScrollX(-100)
      })
      expect(result.current.scrollX).toBe(0)
    })

    test('should zoom to fit timeline', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.zoomToFit()
      })

      // Should calculate zoom to fit 120s duration in 1200px width
      expect(result.current.zoom).toBe(0.1) // 1200 / (120 * 100) = 0.1
      expect(result.current.scrollX).toBe(0)
    })
  })

  describe('Element Management', () => {
    test('should add elements to layers', () => {
      const { result } = renderHook(() => useTimelineStore())
      
      // First create a layer
      let layerId = ''
      act(() => {
        layerId = result.current.addLayer({
          name: 'Video Layer',
          type: 'video',
          elements: [],
          locked: false,
          visible: true,
          height: 80,
          color: '#3b82f6',
          order: 0
        }, 'test-track')
      })

      // Add element to layer
      let elementId = ''
      act(() => {
        elementId = result.current.addElement({
          type: 'video',
          name: 'Test Video',
          layerId,
          startTime: 10,
          duration: 15,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          properties: [],
          locked: false,
          visible: true
        }, layerId)
      })

      expect(elementId).toBeTruthy()
      
      // Find the element in the project
      let foundElement: TimelineElement | null = null
      result.current.project?.tracks.forEach(track => {
        track.layers.forEach(layer => {
          const element = layer.elements.find(el => el.id === elementId)
          if (element) foundElement = element
        })
      })

      expect(foundElement).toBeTruthy()
      expect(foundElement?.name).toBe('Test Video')
      expect(foundElement?.startTime).toBe(10)
      expect(foundElement?.duration).toBe(15)
      expect(foundElement?.endTime).toBe(25)
    })

    test('should update element properties', () => {
      const { result } = renderHook(() => useTimelineStore())
      
      // Create layer and element first
      let layerId = ''
      let elementId = ''
      
      act(() => {
        layerId = result.current.addLayer({
          name: 'Test Layer',
          type: 'video',
          elements: [],
          locked: false,
          visible: true,
          height: 80,
          color: '#3b82f6',
          order: 0
        }, 'test-track')

        elementId = result.current.addElement({
          type: 'video',
          name: 'Test Element',
          layerId,
          startTime: 0,
          duration: 10,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          properties: [],
          locked: false,
          visible: true
        }, layerId)
      })

      // Update element
      act(() => {
        result.current.updateElement(elementId, {
          name: 'Updated Element',
          startTime: 5,
          duration: 20,
          opacity: 0.8
        })
      })

      // Find updated element
      let updatedElement: TimelineElement | null = null
      result.current.project?.tracks.forEach(track => {
        track.layers.forEach(layer => {
          const element = layer.elements.find(el => el.id === elementId)
          if (element) updatedElement = element
        })
      })

      expect(updatedElement?.name).toBe('Updated Element')
      expect(updatedElement?.startTime).toBe(5)
      expect(updatedElement?.duration).toBe(20)
      expect(updatedElement?.endTime).toBe(25)
      expect(updatedElement?.opacity).toBe(0.8)
    })

    test('should delete elements', () => {
      const { result } = renderHook(() => useTimelineStore())
      
      // Create layer and element
      let layerId = ''
      let elementId = ''
      
      act(() => {
        layerId = result.current.addLayer({
          name: 'Test Layer',
          type: 'video',
          elements: [],
          locked: false,
          visible: true,
          height: 80,
          color: '#3b82f6',
          order: 0
        }, 'test-track')

        elementId = result.current.addElement({
          type: 'video',
          name: 'Element to Delete',
          layerId,
          startTime: 0,
          duration: 10,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          properties: [],
          locked: false,
          visible: true
        }, layerId)
      })

      // Verify element exists
      let elementExists = false
      result.current.project?.tracks.forEach(track => {
        track.layers.forEach(layer => {
          if (layer.elements.find(el => el.id === elementId)) {
            elementExists = true
          }
        })
      })
      expect(elementExists).toBe(true)

      // Delete element
      act(() => {
        result.current.deleteElement(elementId)
      })

      // Verify element is deleted
      elementExists = false
      result.current.project?.tracks.forEach(track => {
        track.layers.forEach(layer => {
          if (layer.elements.find(el => el.id === elementId)) {
            elementExists = true
          }
        })
      })
      expect(elementExists).toBe(false)
    })

    test('should move elements between layers', () => {
      const { result } = renderHook(() => useTimelineStore())
      
      // Create two layers
      let layer1Id = ''
      let layer2Id = ''
      let elementId = ''
      
      act(() => {
        layer1Id = result.current.addLayer({
          name: 'Layer 1',
          type: 'video',
          elements: [],
          locked: false,
          visible: true,
          height: 80,
          color: '#3b82f6',
          order: 0
        }, 'test-track')

        layer2Id = result.current.addLayer({
          name: 'Layer 2',
          type: 'video',
          elements: [],
          locked: false,
          visible: true,
          height: 80,
          color: '#059669',
          order: 1
        }, 'test-track')

        elementId = result.current.addElement({
          type: 'video',
          name: 'Movable Element',
          layerId: layer1Id,
          startTime: 10,
          duration: 5,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          properties: [],
          locked: false,
          visible: true
        }, layer1Id)
      })

      // Move element to layer 2 at new time
      act(() => {
        result.current.moveElement(elementId, layer2Id, 20)
      })

      // Verify element moved
      let foundInLayer1 = false
      let foundInLayer2 = false
      let movedElement: TimelineElement | null = null

      result.current.project?.tracks.forEach(track => {
        track.layers.forEach(layer => {
          layer.elements.forEach(element => {
            if (element.id === elementId) {
              if (layer.id === layer1Id) foundInLayer1 = true
              if (layer.id === layer2Id) {
                foundInLayer2 = true
                movedElement = element
              }
            }
          })
        })
      })

      expect(foundInLayer1).toBe(false)
      expect(foundInLayer2).toBe(true)
      expect(movedElement?.startTime).toBe(20)
      expect(movedElement?.endTime).toBe(25)
      expect(movedElement?.layerId).toBe(layer2Id)
    })
  })

  describe('Selection Management', () => {
    test('should select single elements', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.selectElement('element-1')
      })

      expect(result.current.selection.elements).toContain('element-1')
      expect(result.current.selection.elements).toHaveLength(1)
    })

    test('should handle multi-selection', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.selectElement('element-1')
        result.current.selectElement('element-2', true) // Add to selection
      })

      expect(result.current.selection.elements).toContain('element-1')
      expect(result.current.selection.elements).toContain('element-2')
      expect(result.current.selection.elements).toHaveLength(2)
    })

    test('should clear selection', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.selectElement('element-1')
        result.current.selectElement('element-2', true)
        result.current.clearSelection()
      })

      expect(result.current.selection.elements).toHaveLength(0)
      expect(result.current.selection.layers).toHaveLength(0)
    })
  })

  describe('History and Undo System', () => {
    test('should track history of actions', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.addToHistory('test_action', 'Test action performed', { test: true })
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].action).toBe('test_action')
      expect(result.current.history[0].description).toBe('Test action performed')
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    test('should handle undo operations', () => {
      const { result } = renderHook(() => useTimelineStore())

      act(() => {
        result.current.addToHistory('action1', 'First action', {})
        result.current.addToHistory('action2', 'Second action', {})
      })

      expect(result.current.historyIndex).toBe(1)
      expect(result.current.canUndo).toBe(true)

      act(() => {
        result.current.undo()
      })

      expect(result.current.historyIndex).toBe(0)
      expect(result.current.canRedo).toBe(true)
    })

    test('should limit history size', () => {
      const { result } = renderHook(() => useTimelineStore())

      // Add more than max history size (50)
      act(() => {
        for (let i = 0; i < 55; i++) {
          result.current.addToHistory(`action${i}`, `Action ${i}`, { index: i })
        }
      })

      expect(result.current.history.length).toBeLessThanOrEqual(50)
    })
  })

  describe('Collaboration Features', () => {
    test('should manage collaborators', () => {
      const { result } = renderHook(() => useTimelineStore())

      const collaborator = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'editor' as const,
        isOnline: true,
        lastActivity: new Date()
      }

      act(() => {
        result.current.addCollaborator(collaborator)
      })

      expect(result.current.collaborators).toContain(collaborator)

      act(() => {
        result.current.removeCollaborator('user-1')
      })

      expect(result.current.collaborators).not.toContain(collaborator)
    })

    test('should update collaborator cursor positions', () => {
      const { result } = renderHook(() => useTimelineStore())

      const collaborator = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'editor' as const,
        isOnline: true,
        lastActivity: new Date()
      }

      act(() => {
        result.current.addCollaborator(collaborator)
        result.current.updateCollaboratorCursor('user-1', 30, 'layer-1', 'element-1')
      })

      const updatedCollaborator = result.current.collaborators.find(c => c.id === 'user-1')
      expect(updatedCollaborator?.cursor?.time).toBe(30)
      expect(updatedCollaborator?.cursor?.layerId).toBe('layer-1')
      expect(updatedCollaborator?.cursor?.elementId).toBe('element-1')
    })
  })

  describe('Performance and Optimization', () => {
    test('should handle large numbers of elements efficiently', () => {
      const { result } = renderHook(() => useTimelineStore())
      
      // Create a layer
      let layerId = ''
      act(() => {
        layerId = result.current.addLayer({
          name: 'Performance Test Layer',
          type: 'video',
          elements: [],
          locked: false,
          visible: true,
          height: 80,
          color: '#3b82f6',
          order: 0
        }, 'test-track')
      })

      const startTime = performance.now()

      // Add many elements
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addElement({
            type: 'video',
            name: `Element ${i}`,
            layerId,
            startTime: i * 2,
            duration: 1.5,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            properties: [],
            locked: false,
            visible: true
          }, layerId)
        }
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should complete within reasonable time (less than 1 second)
      expect(executionTime).toBeLessThan(1000)

      // Verify all elements were added
      let elementCount = 0
      result.current.project?.tracks.forEach(track => {
        track.layers.forEach(layer => {
          elementCount += layer.elements.length
        })
      })
      expect(elementCount).toBe(100)
    })
  })
})
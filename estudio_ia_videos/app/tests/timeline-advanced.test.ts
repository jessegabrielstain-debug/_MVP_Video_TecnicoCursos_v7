/**
 * Advanced Timeline System Tests
 * Comprehensive tests for the video editor timeline functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '@/hooks/use-timeline';
import { TimelineElement } from '@/lib/types/timeline-types';

describe('Advanced Timeline System', () => {
  describe('Timeline Hook', () => {
    it('should initialize with default project settings', () => {
      const { result } = renderHook(() => useTimeline());
      
      expect(result.current.project.name).toBe('Untitled Project');
      expect(result.current.project.duration).toBe(30000); // 30 seconds
      expect(result.current.project.fps).toBe(30);
      expect(result.current.project.resolution).toEqual({ width: 1920, height: 1080 });
      expect(result.current.project.layers).toHaveLength(3); // video, audio, overlay
    });

    it('should add elements to layers correctly', () => {
      const { result } = renderHook(() => useTimeline());
      
      const testElement: TimelineElement = {
        id: 'test-element-1',
        type: 'video',
        layer: 0,
        start: 1000,
        duration: 5000,
        source: '/test-video.mp4'
      };

      act(() => {
        result.current.addElement(testElement, 'video-layer');
      });

      const videoLayer = result.current.project.layers.find(l => l.id === 'video-layer');
      expect(videoLayer?.elements).toHaveLength(1);
      expect(videoLayer?.elements[0].id).toBe('test-element-1');
    });

    it('should handle element selection correctly', () => {
      const { result } = renderHook(() => useTimeline());
      
      const testElement: TimelineElement = {
        id: 'test-element-1',
        type: 'text',
        layer: 2,
        start: 2000,
        duration: 3000,
        source: 'Hello World'
      };

      act(() => {
        result.current.addElement(testElement, 'overlay-layer');
        result.current.selectElement('test-element-1');
      });

      expect(result.current.project.selectedElementIds).toContain('test-element-1');
      
      const selectedElements = result.current.getSelectedElements();
      expect(selectedElements).toHaveLength(1);
      expect(selectedElements[0].id).toBe('test-element-1');
    });

    it('should move elements between layers', () => {
      const { result } = renderHook(() => useTimeline());
      
      const testElement: TimelineElement = {
        id: 'movable-element',
        type: 'image',
        layer: 0,
        start: 1500,
        duration: 4000,
        source: '/test-image.jpg'
      };

      act(() => {
        result.current.addElement(testElement, 'video-layer');
        result.current.moveElement('movable-element', 3000, 'overlay-layer');
      });

      const videoLayer = result.current.project.layers.find(l => l.id === 'video-layer');
      const overlayLayer = result.current.project.layers.find(l => l.id === 'overlay-layer');
      
      expect(videoLayer?.elements).toHaveLength(0);
      expect(overlayLayer?.elements).toHaveLength(1);
      expect(overlayLayer?.elements[0].start).toBe(3000);
    });

    it('should handle playback controls correctly', () => {
      const { result } = renderHook(() => useTimeline());
      
      act(() => {
        result.current.seek(5000);
      });
      expect(result.current.project.currentTime).toBe(5000);

      // Test play/pause functionality (isPlaying is a ref, so we test the functions exist)
      expect(typeof result.current.play).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.stop).toBe('function');

      act(() => {
        result.current.stop();
      });
      expect(result.current.project.currentTime).toBe(0);
    });

    it('should manage zoom levels correctly', () => {
      const { result } = renderHook(() => useTimeline());
      
      const initialZoom = result.current.project.zoomLevel;
      
      act(() => {
        result.current.zoomIn();
      });
      expect(result.current.project.zoomLevel).toBeGreaterThan(initialZoom);

      act(() => {
        result.current.zoomOut();
      });
      expect(result.current.project.zoomLevel).toBe(initialZoom);

      act(() => {
        result.current.setZoom(2.5);
      });
      expect(result.current.project.zoomLevel).toBe(2.5);
    });

    it('should handle clipboard operations', () => {
      const { result } = renderHook(() => useTimeline());
      
      const testElement: TimelineElement = {
        id: 'copy-element',
        type: 'audio',
        layer: 1,
        start: 2000,
        duration: 6000,
        source: '/test-audio.mp3'
      };

      act(() => {
        result.current.addElement(testElement, 'audio-layer');
        result.current.copyElements(['copy-element']);
      });

      expect(result.current.project.clipboardElements).toHaveLength(1);

      act(() => {
        result.current.pasteElements(8000, 'audio-layer');
      });

      const audioLayer = result.current.project.layers.find(l => l.id === 'audio-layer');
      expect(audioLayer?.elements).toHaveLength(2);
      
      const pastedElement = audioLayer?.elements.find(e => e.start === 8000);
      expect(pastedElement).toBeDefined();
      expect(pastedElement?.id).not.toBe('copy-element'); // Should have new ID
    });

    it('should add and manage keyframes', () => {
      const { result } = renderHook(() => useTimeline());
      
      const testElement: TimelineElement = {
        id: 'keyframe-element',
        type: 'text',
        layer: 2,
        start: 1000,
        duration: 5000,
        source: 'Animated Text',
        properties: {
          opacity: 1,
        }
      };

      act(() => {
        result.current.addElement(testElement, 'overlay-layer');
        result.current.addKeyframe('keyframe-element', {
          id: 'keyframe-1',
          timestamp: 2000,
          property: 'opacity',
          value: 0.5,
          easing: 'ease-in-out'
        });
      });

      const overlayLayer = result.current.project.layers.find(l => l.id === 'overlay-layer');
      const element = overlayLayer?.elements.find(e => e.id === 'keyframe-element');
      
      expect(element?.properties?.keyframes).toHaveLength(1);
      expect(element?.properties?.keyframes[0].property).toBe('opacity');
      expect(element?.properties?.keyframes[0].value).toBe(0.5);
    });

    it('should manage layer operations correctly', () => {
      const { result } = renderHook(() => useTimeline());
      
      const initialLayerCount = result.current.project.layers.length;
      
      const newLayer = {
        id: 'custom-layer',
        name: 'Custom Layer',
        elements: [],
        isVisible: true,
        isLocked: false,
      };

      act(() => {
        result.current.addLayer(newLayer);
      });

      expect(result.current.project.layers).toHaveLength(initialLayerCount + 1);
      
      const addedLayer = result.current.project.layers.find(l => l.id === 'custom-layer');
      expect(addedLayer?.name).toBe('Custom Layer');

      act(() => {
        result.current.updateLayer('custom-layer', { name: 'Updated Layer Name' });
      });

      const updatedLayer = result.current.project.layers.find(l => l.id === 'custom-layer');
      expect(updatedLayer?.name).toBe('Updated Layer Name');

      act(() => {
        result.current.removeLayer('custom-layer');
      });

      expect(result.current.project.layers).toHaveLength(initialLayerCount);
    });

    it('should get elements at specific time correctly', () => {
      const { result } = renderHook(() => useTimeline());
      
      const elements: TimelineElement[] = [
        {
          id: 'element-1',
          type: 'video',
          layer: 0,
          start: 1000,
          duration: 3000, // ends at 4000
          source: 'video1.mp4'
        },
        {
          id: 'element-2',
          type: 'audio',
          layer: 1,
          start: 2000,
          duration: 4000, // ends at 6000
          source: 'audio1.mp3'
        }
      ];

      act(() => {
        elements.forEach(element => {
          result.current.addElement(element, element.layer === 0 ? 'video-layer' : 'audio-layer');
        });
      });

      const elementsAt0 = result.current.getElementsAtTime(0);
      expect(elementsAt0).toHaveLength(0);

      const elementsAt2500 = result.current.getElementsAtTime(2500);
      expect(elementsAt2500).toHaveLength(2); // Both elements active

      const elementsAt5000 = result.current.getElementsAtTime(5000);
      expect(elementsAt5000).toHaveLength(1); // Only audio element active

      const elementsAt7000 = result.current.getElementsAtTime(7000);
      expect(elementsAt7000).toHaveLength(0); // No elements active
    });
  });

  describe('Timeline Types and Validation', () => {
    it('should support all element types', () => {
      const elementTypes: TimelineElement['type'][] = [
        'video', 'audio', 'text', 'image', 'pptx-slide'
      ];

      elementTypes.forEach(type => {
        const el: TimelineElement = { id: type, type, start: 0, duration: 1, source: '', layer: 0 };
        expect(el.type).toBe(type);
      });
    });

    it('should validate element properties structure', () => {
      const { result } = renderHook(() => useTimeline());
      
      const validElement: TimelineElement = {
        id: 'validation-test',
        type: 'pptx-slide',
        layer: 2,
        start: 0,
        duration: 5000,
        source: 'slide1',
        data: {
          slideData: {
            slideIndex: 0,
            content: 'Slide content',
            backgroundImage: '/slide-bg.jpg',
            animations: []
          }
        },
      };

      expect(() => {
        act(() => {
          result.current.addElement(validElement, 'overlay-layer');
        });
      }).not.toThrow();

      const addedElement = result.current.project.layers
        .find(l => l.id === 'overlay-layer')
        ?.elements.find(e => e.id === 'validation-test');

      expect(addedElement?.data.slideData?.slideIndex).toBe(0);
      expect(addedElement?.data.slideData?.content).toBe('Slide content');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple rapid operations', () => {
      const { result } = renderHook(() => useTimeline());
      
      // Simulate rapid operations
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.seek(i * 1000);
          result.current.setZoom(1 + i * 0.1);
        }
      });

      expect(result.current.project.currentTime).toBe(9000);
      expect(result.current.project.zoomLevel).toBe(1.9);
    });

    it('should handle boundary conditions', () => {
      const { result } = renderHook(() => useTimeline());
      
      // Test negative time (should clamp to 0)
      act(() => {
        result.current.seek(-1000);
      });
      expect(result.current.project.currentTime).toBe(0);

      // Test zero zoom (should clamp to minimum)
      act(() => {
        result.current.setZoom(0);
      });
      expect(result.current.project.zoomLevel).toBe(0.1);

      // Test maximum zoom
      act(() => {
        result.current.setZoom(15);
      });
      expect(result.current.project.zoomLevel).toBe(10); // Should clamp to max
    });
  });
});
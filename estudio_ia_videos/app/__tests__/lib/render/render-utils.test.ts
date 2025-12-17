/**
 * @fileoverview Tests for render-utils
 * Comprehensive tests for video rendering utility functions
 */

import {
  parseResolution,
  calculateBitrate,
  generateFFmpegArgs,
  calculateTotalDuration,
  secondsToFrames,
  framesToSeconds,
  generateTempFileName,
  formatFileSize,
  formatDuration,
  validateVideoSettings,
  type VideoSettings,
  type SlideData,
} from '@/lib/render/render-utils';

// =============================================
// parseResolution Tests
// =============================================
describe('parseResolution', () => {
  it('should parse 720p', () => {
    const result = parseResolution('720p');
    expect(result).toEqual({ width: 1280, height: 720 });
  });

  it('should parse 1080p', () => {
    const result = parseResolution('1080p');
    expect(result).toEqual({ width: 1920, height: 1080 });
  });

  it('should parse 4k', () => {
    const result = parseResolution('4k');
    expect(result).toEqual({ width: 3840, height: 2160 });
  });

  it('should default to 1080p for unknown resolution', () => {
    const result = parseResolution('unknown');
    expect(result).toEqual({ width: 1920, height: 1080 });
  });

  it('should default to 1080p for empty string', () => {
    const result = parseResolution('');
    expect(result).toEqual({ width: 1920, height: 1080 });
  });
});

// =============================================
// calculateBitrate Tests
// =============================================
describe('calculateBitrate', () => {
  it('should calculate bitrate for 720p low', () => {
    const result = calculateBitrate('720p', 'low');
    expect(result).toBe(1 * 1000); // 1000
  });

  it('should calculate bitrate for 1080p medium', () => {
    const result = calculateBitrate('1080p', 'medium');
    expect(result).toBe(2 * 2500); // 5000
  });

  it('should calculate bitrate for 1080p high', () => {
    const result = calculateBitrate('1080p', 'high');
    expect(result).toBe(2 * 5000); // 10000
  });

  it('should calculate bitrate for 4k ultra', () => {
    const result = calculateBitrate('4k', 'ultra');
    expect(result).toBe(6 * 8000); // 48000
  });

  it('should use defaults for unknown resolution', () => {
    const result = calculateBitrate('unknown', 'high');
    expect(result).toBe(2 * 5000); // 10000 (default resolution multiplier)
  });

  it('should use defaults for unknown quality', () => {
    const result = calculateBitrate('1080p', 'unknown');
    expect(result).toBe(2 * 2500); // 5000 (default quality multiplier)
  });
});

// =============================================
// generateFFmpegArgs Tests
// =============================================
describe('generateFFmpegArgs', () => {
  const baseSettings: VideoSettings = {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    quality: 'high',
    codec: 'h264',
    format: 'mp4',
  };

  it('should generate basic args without audio', () => {
    const args = generateFFmpegArgs(baseSettings, '/tmp/frames');
    
    expect(args).toContain('-framerate');
    expect(args).toContain('30');
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-crf');
    expect(args).toContain('18'); // high quality
    expect(args).toContain('-s');
    expect(args).toContain('1920x1080');
    expect(args).toContain('-pix_fmt');
    expect(args).toContain('yuv420p');
  });

  it('should include audio args when audio path provided', () => {
    const args = generateFFmpegArgs(baseSettings, '/tmp/frames', '/tmp/audio.mp3');
    
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
    expect(args).toContain('-b:a');
    expect(args).toContain('192k');
  });

  it('should include output path with overwrite flag', () => {
    const args = generateFFmpegArgs(baseSettings, '/tmp/frames', undefined, '/tmp/output.mp4');
    
    expect(args).toContain('-y');
    expect(args).toContain('/tmp/output.mp4');
  });

  it('should use correct codec for h265', () => {
    const settings = { ...baseSettings, codec: 'h265' as const };
    const args = generateFFmpegArgs(settings, '/tmp/frames');
    
    expect(args).toContain('libx265');
  });

  it('should use correct codec for vp8', () => {
    const settings = { ...baseSettings, codec: 'vp8' as const };
    const args = generateFFmpegArgs(settings, '/tmp/frames');
    
    expect(args).toContain('libvpx');
  });

  it('should use correct codec for vp9', () => {
    const settings = { ...baseSettings, codec: 'vp9' as const };
    const args = generateFFmpegArgs(settings, '/tmp/frames');
    
    expect(args).toContain('libvpx-vp9');
  });

  it('should use correct CRF for ultra quality', () => {
    const settings = { ...baseSettings, quality: 'ultra' as const };
    const args = generateFFmpegArgs(settings, '/tmp/frames');
    
    expect(args).toContain('-crf');
    expect(args).toContain('15');
  });

  it('should use correct CRF for low quality', () => {
    const settings = { ...baseSettings, quality: 'low' as const };
    const args = generateFFmpegArgs(settings, '/tmp/frames');
    
    expect(args).toContain('-crf');
    expect(args).toContain('28');
  });

  it('should include optimization flags', () => {
    const args = generateFFmpegArgs(baseSettings, '/tmp/frames');
    
    expect(args).toContain('-movflags');
    expect(args).toContain('+faststart');
    expect(args).toContain('-threads');
    expect(args).toContain('0');
  });
});

// =============================================
// calculateTotalDuration Tests
// =============================================
describe('calculateTotalDuration', () => {
  it('should calculate total duration from slides', () => {
    const slides: SlideData[] = [
      { id: '1', duration: 5 },
      { id: '2', duration: 10 },
      { id: '3', duration: 3 },
    ];
    
    expect(calculateTotalDuration(slides)).toBe(18);
  });

  it('should return 0 for empty slides', () => {
    expect(calculateTotalDuration([])).toBe(0);
  });

  it('should handle single slide', () => {
    const slides: SlideData[] = [{ id: '1', duration: 7 }];
    expect(calculateTotalDuration(slides)).toBe(7);
  });

  it('should handle decimal durations', () => {
    const slides: SlideData[] = [
      { id: '1', duration: 2.5 },
      { id: '2', duration: 3.5 },
    ];
    expect(calculateTotalDuration(slides)).toBe(6);
  });
});

// =============================================
// secondsToFrames Tests
// =============================================
describe('secondsToFrames', () => {
  it('should convert seconds to frames at 30fps', () => {
    expect(secondsToFrames(1, 30)).toBe(30);
    expect(secondsToFrames(2, 30)).toBe(60);
  });

  it('should convert seconds to frames at 60fps', () => {
    expect(secondsToFrames(1, 60)).toBe(60);
    expect(secondsToFrames(2.5, 60)).toBe(150);
  });

  it('should round up fractional frames', () => {
    expect(secondsToFrames(1.1, 30)).toBe(33); // 33 = ceil(33)
    expect(secondsToFrames(0.5, 30)).toBe(15);
  });

  it('should handle zero seconds', () => {
    expect(secondsToFrames(0, 30)).toBe(0);
  });

  it('should handle 24fps', () => {
    expect(secondsToFrames(1, 24)).toBe(24);
  });
});

// =============================================
// framesToSeconds Tests
// =============================================
describe('framesToSeconds', () => {
  it('should convert frames to seconds at 30fps', () => {
    expect(framesToSeconds(30, 30)).toBe(1);
    expect(framesToSeconds(60, 30)).toBe(2);
  });

  it('should convert frames to seconds at 60fps', () => {
    expect(framesToSeconds(60, 60)).toBe(1);
    expect(framesToSeconds(150, 60)).toBe(2.5);
  });

  it('should handle fractional results', () => {
    expect(framesToSeconds(45, 30)).toBe(1.5);
  });

  it('should handle zero frames', () => {
    expect(framesToSeconds(0, 30)).toBe(0);
  });
});

// =============================================
// generateTempFileName Tests
// =============================================
describe('generateTempFileName', () => {
  it('should generate unique filename with prefix', () => {
    const name1 = generateTempFileName('video', 'mp4');
    expect(name1).toMatch(/^video_\d+_[a-z0-9]+\.mp4$/);
  });

  it('should generate different names on each call', () => {
    const name1 = generateTempFileName('frame', 'png');
    const name2 = generateTempFileName('frame', 'png');
    expect(name1).not.toBe(name2);
  });

  it('should use correct extension', () => {
    const name = generateTempFileName('audio', 'wav');
    expect(name).toMatch(/\.wav$/);
  });

  it('should handle empty prefix', () => {
    const name = generateTempFileName('', 'txt');
    expect(name).toMatch(/^_\d+_[a-z0-9]+\.txt$/);
  });
});

// =============================================
// formatFileSize Tests
// =============================================
describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });

  it('should format with decimal precision', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});

// =============================================
// formatDuration Tests
// =============================================
describe('formatDuration', () => {
  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('00:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(90)).toBe('01:30');
    expect(formatDuration(125)).toBe('02:05');
  });

  it('should format hours, minutes and seconds', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
    expect(formatDuration(7325)).toBe('02:02:05');
  });

  it('should pad with zeros', () => {
    expect(formatDuration(5)).toBe('00:05');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3605)).toBe('01:00:05');
  });

  it('should handle zero', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('should truncate decimal seconds', () => {
    expect(formatDuration(5.7)).toBe('00:05');
  });
});

// =============================================
// validateVideoSettings Tests
// =============================================
describe('validateVideoSettings', () => {
  const validSettings: VideoSettings = {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    quality: 'high',
    codec: 'h264',
    format: 'mp4',
  };

  it('should return empty array for valid settings', () => {
    const errors = validateVideoSettings(validSettings);
    expect(errors).toEqual([]);
  });

  it('should validate FPS minimum', () => {
    const settings = { ...validSettings, fps: 0 };
    const errors = validateVideoSettings(settings);
    expect(errors).toContain('FPS deve estar entre 1 e 120');
  });

  it('should validate FPS maximum', () => {
    const settings = { ...validSettings, fps: 121 };
    const errors = validateVideoSettings(settings);
    expect(errors).toContain('FPS deve estar entre 1 e 120');
  });

  it('should validate minimum resolution', () => {
    const settings = { 
      ...validSettings, 
      resolution: { width: 100, height: 100 } 
    };
    const errors = validateVideoSettings(settings);
    expect(errors).toContain('Resolução mínima é 320x240');
  });

  it('should validate maximum resolution', () => {
    const settings = { 
      ...validSettings, 
      resolution: { width: 8000, height: 5000 } 
    };
    const errors = validateVideoSettings(settings);
    expect(errors).toContain('Resolução máxima é 7680x4320 (8K)');
  });

  it('should return multiple errors if multiple validations fail', () => {
    const settings = { 
      ...validSettings, 
      fps: 0,
      resolution: { width: 100, height: 100 } 
    };
    const errors = validateVideoSettings(settings);
    expect(errors).toHaveLength(2);
  });

  it('should accept edge case FPS values', () => {
    expect(validateVideoSettings({ ...validSettings, fps: 1 })).toEqual([]);
    expect(validateVideoSettings({ ...validSettings, fps: 120 })).toEqual([]);
  });

  it('should accept edge case resolutions', () => {
    expect(validateVideoSettings({ 
      ...validSettings, 
      resolution: { width: 320, height: 240 } 
    })).toEqual([]);
    
    expect(validateVideoSettings({ 
      ...validSettings, 
      resolution: { width: 7680, height: 4320 } 
    })).toEqual([]);
  });
});

// =============================================
// Integration Tests
// =============================================
describe('Render Utils Integration', () => {
  it('should work together for video calculation', () => {
    const slides: SlideData[] = [
      { id: '1', duration: 5 },
      { id: '2', duration: 10 },
    ];
    const fps = 30;
    
    const totalDuration = calculateTotalDuration(slides);
    const totalFrames = secondsToFrames(totalDuration, fps);
    const backToSeconds = framesToSeconds(totalFrames, fps);
    
    expect(totalDuration).toBe(15);
    expect(totalFrames).toBe(450);
    expect(backToSeconds).toBe(15);
  });

  it('should generate valid FFmpeg args for 4k video', () => {
    const resolution = parseResolution('4k');
    const settings: VideoSettings = {
      resolution,
      fps: 60,
      quality: 'ultra',
      codec: 'h265',
      format: 'mp4',
    };
    
    const errors = validateVideoSettings(settings);
    expect(errors).toEqual([]);
    
    const args = generateFFmpegArgs(settings, '/tmp/frames', '/tmp/audio.mp3', '/tmp/output.mp4');
    expect(args).toContain('3840x2160');
    expect(args).toContain('60');
    expect(args).toContain('libx265');
    expect(args).toContain('15'); // ultra CRF
  });
});

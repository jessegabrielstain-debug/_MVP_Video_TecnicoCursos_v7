
import { validateFFmpeg, getVideoInfo, renderVideo } from '../../../lib/video/renderer';
import ffmpeg from 'fluent-ffmpeg';

jest.mock('fluent-ffmpeg');

describe('Video Renderer', () => {
  const mockFfmpeg = {
    getAvailableFormats: jest.fn(),
    ffprobe: jest.fn(),
    output: jest.fn().mockReturnThis(),
    size: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ffmpeg as unknown as jest.Mock).mockReturnValue(mockFfmpeg);
    (ffmpeg.getAvailableFormats as jest.Mock) = mockFfmpeg.getAvailableFormats;
    (ffmpeg.ffprobe as jest.Mock) = mockFfmpeg.ffprobe;
  });

  describe('validateFFmpeg', () => {
    it('should return true when formats are available', async () => {
      mockFfmpeg.getAvailableFormats.mockImplementation((cb) => cb(null, { mp4: 'MP4 format' }));
      const result = await validateFFmpeg();
      expect(result).toBe(true);
    });

    it('should return false when error occurs', async () => {
      mockFfmpeg.getAvailableFormats.mockImplementation((cb) => cb(new Error('FFmpeg not found'), null));
      const result = await validateFFmpeg();
      expect(result).toBe(false);
    });
  });

  describe('getVideoInfo', () => {
    it('should return video info on success', async () => {
      const mockMetadata = {
        format: { duration: 100, format_name: 'mov' },
        streams: [{ codec_type: 'video', width: 1920, height: 1080 }]
      };
      mockFfmpeg.ffprobe.mockImplementation((path, cb) => cb(null, mockMetadata));

      const info = await getVideoInfo('test.mp4');
      expect(info).toEqual({
        duration: 100,
        resolution: { width: 1920, height: 1080 },
        format: 'mov'
      });
    });

    it('should reject on error', async () => {
      mockFfmpeg.ffprobe.mockImplementation((path, cb) => cb(new Error('Probe failed'), null));
      await expect(getVideoInfo('test.mp4')).rejects.toThrow('Probe failed');
    });
  });

  describe('renderVideo', () => {
    it('should render video successfully', async () => {
      mockFfmpeg.on.mockImplementation((event, cb) => {
        if (event === 'end') cb();
        return mockFfmpeg;
      });

      await renderVideo('input.mp4', 'output.mp4');
      expect(mockFfmpeg.output).toHaveBeenCalledWith('output.mp4');
      expect(mockFfmpeg.run).toHaveBeenCalled();
    });

    it('should handle resolution options', async () => {
      mockFfmpeg.on.mockImplementation((event, cb) => {
        if (event === 'end') cb();
        return mockFfmpeg;
      });

      await renderVideo('input.mp4', 'output.mp4', { resolution: '1080p' });
      expect(mockFfmpeg.size).toHaveBeenCalledWith('1920x1080');
    });

    it('should reject on render error', async () => {
      mockFfmpeg.on.mockImplementation((event, cb) => {
        if (event === 'error') cb(new Error('Render failed'));
        return mockFfmpeg;
      });

      await expect(renderVideo('input.mp4', 'output.mp4')).rejects.toThrow('Render failed');
    });
  });
});

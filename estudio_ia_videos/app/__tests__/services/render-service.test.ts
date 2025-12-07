
import fs from 'fs';
import path from 'path';
import { RenderService } from '../../lib/services/render-service';

// Mocks
jest.mock('fs');
jest.mock('path');
jest.mock('@remotion/bundler', () => ({
  bundle: jest.fn().mockResolvedValue('/mock/bundle/path'),
}));
jest.mock('@remotion/renderer', () => ({
  selectComposition: jest.fn().mockResolvedValue({
    durationInFrames: 300,
    width: 1920,
    height: 1080,
    fps: 30,
    id: 'MyVideo'
  }),
  renderMedia: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/aws-s3-config', () => ({
  uploadFileToS3: jest.fn().mockResolvedValue({
    url: 'https://mock-s3-url.com/video.mp4',
    key: 'renders/video.mp4'
  }),
}));
jest.mock('../../lib/services/logger-service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('RenderService', () => {
  const mockProjectId = 'test-project-123';
  const mockSlides = [{ id: '1', content: 'Test' }];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fs.existsSync to return true for directory checks
    jest.mocked(fs.existsSync).mockReturnValue(true);
    // Mock fs.readFileSync to return a buffer
    jest.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fake-video-data'));
    // Mock path.join to behave somewhat realistically or just return joined strings
    jest.mocked(path.join).mockImplementation((...args) => args.join('/'));
    jest.mocked(path.dirname).mockReturnValue('/mock/dir');
  });

  it('should successfully render a video and upload to S3', async () => {
    const result = await RenderService.renderVideo(mockProjectId, mockSlides);

    expect(result).toEqual({
      success: true,
      videoUrl: 'https://mock-s3-url.com/video.mp4',
      s3Key: expect.stringContaining('renders/')
    });

    // Verify steps were called
    const { bundle } = require('@remotion/bundler');
    expect(bundle).toHaveBeenCalled();

    const { renderMedia } = require('@remotion/renderer');
    expect(renderMedia).toHaveBeenCalledWith(expect.objectContaining({
      codec: 'h264',
      inputProps: { slides: mockSlides }
    }));

    const { uploadFileToS3 } = require('../../lib/aws-s3-config');
    expect(uploadFileToS3).toHaveBeenCalled();
  });

  it('should handle render errors gracefully', async () => {
    const { renderMedia } = require('@remotion/renderer');
    renderMedia.mockRejectedValue(new Error('Render failed'));

    await expect(RenderService.renderVideo(mockProjectId, mockSlides))
      .rejects.toThrow('Render failed');
  });
});

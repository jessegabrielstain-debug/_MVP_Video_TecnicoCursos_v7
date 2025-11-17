import { PPTXImageParser } from '@/lib/pptx/parsers/image-parser';
import JSZip from 'jszip';

// Mock dependencies
jest.mock('jszip');
jest.mock('xml2js');
jest.mock('sharp');
jest.mock('../../../lib/s3-storage');

// Mock S3StorageService
const mockS3StorageService = {
  uploadFile: jest.fn().mockResolvedValue('https://s3.example.com/test-image.jpg')
};

jest.mock('../../../lib/s3/storage-service', () => ({
  S3StorageService: mockS3StorageService
}));

describe('PPTXImageParser', () => {
  let parser: PPTXImageParser;
  let mockZip: jest.Mocked<JSZip>;

  beforeEach(() => {
    parser = new PPTXImageParser();
    mockZip = new JSZip() as jest.Mocked<JSZip>;
    jest.clearAllMocks();
  });

  describe('extractImages', () => {
    it('should extract images from slides successfully', async () => {
      // Mock image files in the zip
      const mockImageBuffer = Buffer.from('fake-image-data');
      
      const mockImageFiles = [
        { name: 'ppt/media/image1.jpg' },
        { name: 'ppt/media/image2.png' },
        { name: 'ppt/media/image3.gif' }
      ];

      mockZip.filter = jest.fn().mockReturnValue(mockImageFiles);
      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(mockImageBuffer)
      });

      const result = await parser.extractImages(mockZip, 'test-project');

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        originalName: 'image1.jpg',
        s3Url: 'https://s3.example.com/test-image.jpg',
        type: 'image/jpeg',
        size: mockImageBuffer.length
      });

      expect(mockS3StorageService.uploadFile).toHaveBeenCalledTimes(3);
    });

    it('should handle different image formats', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      
      const mockImageFiles = [
        { name: 'ppt/media/image1.jpg' },
        { name: 'ppt/media/image2.png' },
        { name: 'ppt/media/image3.gif' },
        { name: 'ppt/media/image4.bmp' },
        { name: 'ppt/media/image5.tiff' }
      ];

      mockZip.filter = jest.fn().mockReturnValue(mockImageFiles);
      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(mockImageBuffer)
      });

      const result = await parser.extractImages(mockZip, 'test-project');

      expect(result).toHaveLength(5);
      
      // Check that different MIME types are correctly identified
      const expectedTypes = [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/bmp',
        'image/tiff'
      ];

      result.forEach((image, index) => {
        expect(image.type).toBe(expectedTypes[index]);
      });
    });

    it('should skip non-image files', async () => {
      const mockFiles = [
        { name: 'ppt/media/image1.jpg' },
        { name: 'ppt/media/video1.mp4' }, // Should be skipped
        { name: 'ppt/media/audio1.mp3' }, // Should be skipped
        { name: 'ppt/media/image2.png' }
      ];

      mockZip.filter = jest.fn().mockReturnValue(mockFiles);
      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(Buffer.from('fake-data'))
      });

      const result = await parser.extractImages(mockZip, 'test-project');

      expect(result).toHaveLength(2); // Only image files
      expect(result[0].originalName).toBe('image1.jpg');
      expect(result[1].originalName).toBe('image2.png');
    });

    it('should handle upload errors gracefully', async () => {
      const mockImageFiles = [
        { name: 'ppt/media/image1.jpg' }
      ];

      mockZip.filter = jest.fn().mockReturnValue(mockImageFiles);
      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(Buffer.from('fake-image-data'))
      });

      // Mock S3 upload failure
      mockS3StorageService.uploadFile.mockRejectedValueOnce(new Error('Upload failed'));

      const result = await parser.extractImages(mockZip, 'test-project');

      expect(result).toHaveLength(0); // Should return empty array on error
    });

    it('should handle empty media folder', async () => {
      mockZip.filter = jest.fn().mockReturnValue([]);

      const result = await parser.extractImages(mockZip, 'test-project');

      expect(result).toHaveLength(0);
      expect(mockS3StorageService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('processImage', () => {
    it('should process image with correct metadata', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockImageFile = { name: 'ppt/media/test-image.jpg' };

      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(mockBuffer)
      });

      const result = await parser.processImage(mockZip, mockImageFile, 'test-project');

      expect(result).toMatchObject({
        originalName: 'test-image.jpg',
        s3Key: expect.stringContaining('test-project/images/'),
        s3Url: 'https://s3.example.com/test-image.jpg',
        type: 'image/jpeg',
        size: mockBuffer.length
      });

      expect(mockS3StorageService.uploadFile).toHaveBeenCalledWith(
        mockBuffer,
        expect.stringContaining('test-project/images/'),
        'image/jpeg',
        expect.objectContaining({
          type: 'pptx-image',
          projectId: 'test-project',
          originalName: 'test-image.jpg'
        })
      );
    });
  });

  describe('uploadImageToS3', () => {
    it('should upload image with correct parameters', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const s3Key = 'test-project/images/test-image.jpg';

      const result = await parser.uploadImageToS3(mockBuffer, s3Key, 'image/jpeg', {
        type: 'pptx-image',
        projectId: 'test-project',
        originalName: 'test-image.jpg'
      });

      expect(result).toBe('https://s3.example.com/test-image.jpg');
      expect(mockS3StorageService.uploadFile).toHaveBeenCalledWith(
        mockBuffer,
        s3Key,
        'image/jpeg',
        {
          type: 'pptx-image',
          projectId: 'test-project',
          originalName: 'test-image.jpg'
        }
      );
    });

    it('should handle upload failures', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const s3Key = 'test-project/images/test-image.jpg';

      mockS3StorageService.uploadFile.mockRejectedValueOnce(new Error('S3 upload failed'));

      await expect(
        parser.uploadImageToS3(mockBuffer, s3Key, 'image/jpeg', {})
      ).rejects.toThrow('S3 upload failed');
    });
  });

  describe('helper methods', () => {
    describe('isImageFile', () => {
      it('should correctly identify image files', () => {
        expect(parser['isImageFile']('image.jpg')).toBe(true);
        expect(parser['isImageFile']('image.jpeg')).toBe(true);
        expect(parser['isImageFile']('image.png')).toBe(true);
        expect(parser['isImageFile']('image.gif')).toBe(true);
        expect(parser['isImageFile']('image.bmp')).toBe(true);
        expect(parser['isImageFile']('image.tiff')).toBe(true);
        expect(parser['isImageFile']('image.webp')).toBe(true);
        
        expect(parser['isImageFile']('video.mp4')).toBe(false);
        expect(parser['isImageFile']('audio.mp3')).toBe(false);
        expect(parser['isImageFile']('document.pdf')).toBe(false);
      });
    });

    describe('getImageMimeType', () => {
      it('should return correct MIME types', () => {
        expect(parser['getImageMimeType']('image.jpg')).toBe('image/jpeg');
        expect(parser['getImageMimeType']('image.jpeg')).toBe('image/jpeg');
        expect(parser['getImageMimeType']('image.png')).toBe('image/png');
        expect(parser['getImageMimeType']('image.gif')).toBe('image/gif');
        expect(parser['getImageMimeType']('image.bmp')).toBe('image/bmp');
        expect(parser['getImageMimeType']('image.tiff')).toBe('image/tiff');
        expect(parser['getImageMimeType']('image.webp')).toBe('image/webp');
        expect(parser['getImageMimeType']('unknown.xyz')).toBe('image/jpeg');
      });
    });

    describe('extractFileName', () => {
      it('should extract filename from path', () => {
        expect(parser['extractFileName']('ppt/media/image1.jpg')).toBe('image1.jpg');
        expect(parser['extractFileName']('ppt/media/subfolder/image2.png')).toBe('image2.png');
        expect(parser['extractFileName']('image3.gif')).toBe('image3.gif');
      });
    });
  });
});
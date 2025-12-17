/**
 * @fileoverview Tests for storage module (local and S3 adapters)
 * Comprehensive tests for storage adapters and factory
 */

import path from 'path';
import { promises as fs } from 'fs';
import { createStorage } from '@/lib/storage';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => params),
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Storage Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // =============================================
  // Factory Tests
  // =============================================
  describe('createStorage factory', () => {
    it('should create LocalStorage by default', () => {
      delete process.env.STORAGE_PROVIDER;
      const storage = createStorage();
      expect(storage).toBeDefined();
      expect(storage.saveFile).toBeDefined();
    });

    it('should create LocalStorage when provider is "local"', () => {
      process.env.STORAGE_PROVIDER = 'local';
      const storage = createStorage();
      expect(storage).toBeDefined();
    });

    it('should create LocalStorage when provider is "LOCAL" (case insensitive)', () => {
      process.env.STORAGE_PROVIDER = 'LOCAL';
      const storage = createStorage();
      expect(storage).toBeDefined();
    });

    it('should create S3Storage when provider is "s3"', () => {
      process.env.STORAGE_PROVIDER = 's3';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      const storage = createStorage();
      expect(storage).toBeDefined();
    });

    it('should create S3Storage when provider is "S3" (case insensitive)', () => {
      process.env.STORAGE_PROVIDER = 'S3';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      const storage = createStorage();
      expect(storage).toBeDefined();
    });

    it('should default to LocalStorage for unknown provider', () => {
      process.env.STORAGE_PROVIDER = 'unknown';
      const storage = createStorage();
      // Should fallback to local storage
      expect(storage).toBeDefined();
    });
  });

  // =============================================
  // LocalStorage Tests
  // =============================================
  describe('LocalStorage', () => {
    beforeEach(() => {
      delete process.env.STORAGE_PROVIDER;
    });

    it('should save file to local filesystem', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('test content');
      const key = 'test-file.txt';

      const result = await storage.saveFile(buffer, key);

      expect(result.url).toBe('/uploads/test-file.txt');
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-file.txt'),
        buffer
      );
    });

    it('should create directory structure for nested keys', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('nested content');
      const key = 'videos/2024/01/video.mp4';

      const result = await storage.saveFile(buffer, key);

      expect(result.url).toBe('/uploads/videos/2024/01/video.mp4');
      expect(fs.mkdir).toHaveBeenCalledTimes(2); // upload dir + nested dir
    });

    it('should normalize path separators in URL', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('content');
      const key = 'folder\\subfolder\\file.txt';

      const result = await storage.saveFile(buffer, key);

      // Backslashes should be converted to forward slashes
      expect(result.url).not.toContain('\\');
      expect(result.url).toContain('/');
    });

    it('should handle empty buffer', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('');
      const key = 'empty.txt';

      const result = await storage.saveFile(buffer, key);

      expect(result.url).toBe('/uploads/empty.txt');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        buffer
      );
    });

    it('should handle special characters in filename', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('content');
      const key = 'file with spaces (1).txt';

      const result = await storage.saveFile(buffer, key);

      expect(result.url).toBe('/uploads/file with spaces (1).txt');
    });

    it('should handle unicode filename', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('content');
      const key = 'arquivo_áéíóú.txt';

      const result = await storage.saveFile(buffer, key);

      expect(result.url).toContain('arquivo_áéíóú.txt');
    });
  });

  // =============================================
  // S3Storage Tests
  // =============================================
  describe('S3Storage', () => {
    beforeEach(() => {
      process.env.STORAGE_PROVIDER = 's3';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-west-2';
      mockSend.mockResolvedValue({});
    });

    it('should save file to S3', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('s3 content');
      const key = 'test-s3-file.txt';

      const result = await storage.saveFile(buffer, key, 'text/plain');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'test-s3-file.txt',
          Body: buffer,
          ContentType: 'text/plain',
        })
      );
      expect(result.url).toContain('test-bucket');
      expect(result.url).toContain('test-s3-file.txt');
    });

    it('should use default content type when not provided', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('binary data');
      const key = 'binary-file';

      await storage.saveFile(buffer, key);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'application/octet-stream',
        })
      );
    });

    it('should use default region when not configured', async () => {
      delete process.env.AWS_REGION;
      const storage = createStorage();
      const buffer = Buffer.from('content');

      const result = await storage.saveFile(buffer, 'file.txt');

      // Default region is us-east-1
      expect(result.url).toContain('us-east-1');
    });

    it('should generate correct S3 URL format', async () => {
      delete process.env.AWS_PUBLIC_BASE;
      const storage = createStorage();
      const buffer = Buffer.from('content');

      const result = await storage.saveFile(buffer, 'file.txt');

      expect(result.url).toBe(
        'https://test-bucket.s3.us-west-2.amazonaws.com/file.txt'
      );
    });

    it('should use public base URL when configured', async () => {
      process.env.AWS_PUBLIC_BASE = 'https://cdn.example.com';
      const storage = createStorage();
      const buffer = Buffer.from('content');

      const result = await storage.saveFile(buffer, 'file.txt');

      expect(result.url).toBe('https://cdn.example.com/file.txt');
    });

    it('should handle trailing slash in public base URL', async () => {
      process.env.AWS_PUBLIC_BASE = 'https://cdn.example.com/';
      const storage = createStorage();
      const buffer = Buffer.from('content');

      const result = await storage.saveFile(buffer, 'file.txt');

      expect(result.url).toBe('https://cdn.example.com/file.txt');
      expect(result.url).not.toContain('//file');
    });

    it('should throw error when bucket is not configured', async () => {
      delete process.env.AWS_S3_BUCKET;
      process.env.AWS_S3_BUCKET = ''; // Empty string
      const storage = createStorage();
      const buffer = Buffer.from('content');

      await expect(storage.saveFile(buffer, 'file.txt')).rejects.toThrow(
        'AWS_S3_BUCKET not configured'
      );
    });

    it('should handle S3 upload errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('S3 upload failed'));
      const storage = createStorage();
      const buffer = Buffer.from('content');

      await expect(storage.saveFile(buffer, 'file.txt')).rejects.toThrow(
        'S3 upload failed'
      );
    });

    it('should handle large files', async () => {
      const storage = createStorage();
      // 10MB buffer
      const buffer = Buffer.alloc(10 * 1024 * 1024, 'a');
      const key = 'large-file.bin';

      const result = await storage.saveFile(buffer, key);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Body: buffer,
        })
      );
      expect(result.url).toBeDefined();
    });

    it('should support various content types', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('content');

      const contentTypes = [
        'video/mp4',
        'audio/mpeg',
        'image/png',
        'application/pdf',
        'text/html',
      ];

      for (const contentType of contentTypes) {
        mockSend.mockClear();
        await storage.saveFile(buffer, `file.${contentType.split('/')[1]}`, contentType);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            ContentType: contentType,
          })
        );
      }
    });

    it('should handle nested S3 keys', async () => {
      const storage = createStorage();
      const buffer = Buffer.from('content');
      const key = 'videos/2024/01/15/video-001.mp4';

      const result = await storage.saveFile(buffer, key, 'video/mp4');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: key,
        })
      );
      expect(result.url).toContain(key);
    });
  });

  // =============================================
  // Edge Cases & Integration Tests
  // =============================================
  describe('Edge Cases', () => {
    it('should handle concurrent saves', async () => {
      process.env.STORAGE_PROVIDER = 'local';
      const storage = createStorage();
      const buffer = Buffer.from('content');

      const promises = Array(5)
        .fill(null)
        .map((_, i) => storage.saveFile(buffer, `file-${i}.txt`));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.url).toBe(`/uploads/file-${i}.txt`);
      });
    });

    it('should maintain separate instances', () => {
      process.env.STORAGE_PROVIDER = 'local';
      const storage1 = createStorage();

      process.env.STORAGE_PROVIDER = 's3';
      process.env.AWS_S3_BUCKET = 'bucket';
      const storage2 = createStorage();

      // They should be different instances
      expect(storage1).not.toBe(storage2);
    });

    it('should handle binary data correctly', async () => {
      const storage = createStorage();
      // Create buffer with binary data (not valid UTF-8)
      const binaryData = Buffer.from([0x00, 0xFF, 0x80, 0x7F, 0xFE, 0x01]);

      const result = await storage.saveFile(binaryData, 'binary.bin');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        binaryData
      );
      expect(result.url).toBeDefined();
    });
  });

  // =============================================
  // Interface Compliance Tests
  // =============================================
  describe('StorageAdapter Interface', () => {
    it('LocalStorage should implement saveFile correctly', async () => {
      delete process.env.STORAGE_PROVIDER;
      const storage = createStorage();

      expect(typeof storage.saveFile).toBe('function');

      const result = await storage.saveFile(Buffer.from('test'), 'key');
      expect(result).toHaveProperty('url');
      expect(typeof result.url).toBe('string');
    });

    it('S3Storage should implement saveFile correctly', async () => {
      process.env.STORAGE_PROVIDER = 's3';
      process.env.AWS_S3_BUCKET = 'bucket';
      mockSend.mockResolvedValue({});
      const storage = createStorage();

      expect(typeof storage.saveFile).toBe('function');

      const result = await storage.saveFile(Buffer.from('test'), 'key');
      expect(result).toHaveProperty('url');
      expect(typeof result.url).toBe('string');
    });
  });
});

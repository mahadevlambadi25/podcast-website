import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getS3Config,
  isS3Configured,
  isS3Enabled,
  sanitizeS3Error,
  uploadObjectToS3,
  getObjectFromS3,
  deleteObjectFromS3,
  checkObjectExistsInS3,
  resetS3Client,
} from '../src/lib/s3';
import {
  saveMediaFile,
  resolveMediaFile,
  deleteMediaFile,
  findMediaFile,
  getMimeType,
} from '../src/lib/storage';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

describe('AWS S3 Media Storage Integration Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    resetS3Client();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    resetS3Client();

    // Clean up any test files mirrored locally to public/media
    const testFiles = ['episode-101-art.png', 'network-fail.jpg', 'local-mirror.png'];
    for (const file of testFiles) {
      deleteMediaFile(file).catch(() => {});
    }
  });

  describe('1. S3 Environment Configuration & Detection', () => {
    it('resolves standard AWS_* environment variables with highest priority', () => {
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_REGION = 'ap-south-1';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA_TEST_KEY_12345';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key_67890';

      const config = getS3Config();
      expect(config.bucket).toBe('podcast-media-mahadev-2026');
      expect(config.region).toBe('ap-south-1');
      expect(config.accessKeyId).toBe('AKIA_TEST_KEY_12345');
      expect(config.secretAccessKey).toBe('test_secret_key_67890');
      expect(isS3Configured()).toBe(true);
      expect(isS3Enabled()).toBe(true);
    });

    it('falls back to legacy S3_* aliases when standard AWS_* variables are absent', () => {
      delete process.env.AWS_S3_BUCKET;
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      process.env.S3_BUCKET = 'legacy-s3-bucket';
      process.env.S3_REGION = 'eu-west-1';
      process.env.S3_ACCESS_KEY_ID = 'AKIA_LEGACY_KEY';
      process.env.S3_SECRET_ACCESS_KEY = 'legacy_secret_key';

      const config = getS3Config();
      expect(config.bucket).toBe('legacy-s3-bucket');
      expect(config.region).toBe('eu-west-1');
      expect(config.accessKeyId).toBe('AKIA_LEGACY_KEY');
      expect(config.secretAccessKey).toBe('legacy_secret_key');
      expect(isS3Configured()).toBe(true);
    });

    it('identifies unconfigured state when keys or bucket are missing', () => {
      delete process.env.AWS_S3_BUCKET;
      delete process.env.S3_BUCKET;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.S3_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.S3_SECRET_ACCESS_KEY;
      delete process.env.S3_ENABLED;

      expect(isS3Configured()).toBe(false);
      expect(isS3Enabled()).toBe(false);
    });

    it('respects explicit S3_ENABLED="false" even when credentials exist', () => {
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA_TEST';
      process.env.AWS_SECRET_ACCESS_KEY = 'SECRET_TEST';
      process.env.S3_ENABLED = 'false';

      expect(isS3Configured()).toBe(true);
      expect(isS3Enabled()).toBe(false);
    });

    it('respects explicit S3_ENABLED="true" with various formats and surrounding quotes', () => {
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_ACCESS_KEY_ID = '"AKIA_TEST_QUOTED"';
      process.env.AWS_SECRET_ACCESS_KEY = "'SECRET_TEST_QUOTED'";
      process.env.S3_ENABLED = '"true"';

      const config = getS3Config();
      expect(config.accessKeyId).toBe('AKIA_TEST_QUOTED');
      expect(config.secretAccessKey).toBe('SECRET_TEST_QUOTED');
      expect(isS3Enabled()).toBe(true);

      // Other truthy representations
      process.env.S3_ENABLED = '1';
      expect(isS3Enabled()).toBe(true);
      process.env.S3_ENABLED = 'yes';
      expect(isS3Enabled()).toBe(true);
      process.env.S3_ENABLED = 'TRUE';
      expect(isS3Enabled()).toBe(true);

      // Falsy representations
      process.env.S3_ENABLED = '0';
      expect(isS3Enabled()).toBe(false);
      process.env.S3_ENABLED = 'no';
      expect(isS3Enabled()).toBe(false);
      process.env.S3_ENABLED = '"false"';
      expect(isS3Enabled()).toBe(false);
    });

    it('auto-enables S3 when credentials are fully configured and S3_ENABLED is unset', () => {
      delete process.env.S3_ENABLED;
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA_AUTO_DETECT';
      process.env.AWS_SECRET_ACCESS_KEY = 'SECRET_AUTO_DETECT';

      expect(isS3Configured()).toBe(true);
      expect(isS3Enabled()).toBe(true);
    });
  });

  describe('2. Security & Credential Redaction', () => {
    it('redacts AWS Access Key IDs and Secrets from error messages', () => {
      const leakedError = new Error(
        'SignatureDoesNotMatch: AccessKeyId AKIAIOSFODNN7EXAMPLE was invalid with secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      );
      const sanitized = sanitizeS3Error(leakedError);

      expect(sanitized).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(sanitized).not.toContain('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      expect(sanitized).toContain('[REDACTED_AWS_KEY]');
      expect(sanitized).toContain('[REDACTED_SECRET]');
    });

    it('handles non-Error objects and strings safely', () => {
      expect(sanitizeS3Error(null)).toBe('Unknown S3 error');
      expect(sanitizeS3Error('Plain message')).toBe('Plain message');
    });
  });

  describe('3. Mocked S3 Upload & Storage Operations', () => {
    beforeEach(() => {
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_REGION = 'ap-south-1';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA_MOCK_TEST';
      process.env.AWS_SECRET_ACCESS_KEY = 'SECRET_MOCK_TEST';
      process.env.S3_ENABLED = 'true';
      resetS3Client();
    });

    it('successfully uploads an object to S3 via PutObjectCommand', async () => {
      const sendSpy = vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: any) => {
        if (command instanceof PutObjectCommand) {
          expect(command.input.Bucket).toBe('podcast-media-mahadev-2026');
          expect(command.input.Key).toBe('guest-portrait-test.webp');
          expect(command.input.ContentType).toBe('image/webp');
          return { ETag: '"mock-etag-12345"' } as any;
        }
        throw new Error('Unexpected command');
      });

      const buffer = Buffer.from('test-image-binary-data');
      const result = await uploadObjectToS3({
        key: 'guest-portrait-test.webp',
        body: buffer,
        contentType: 'image/webp',
      });

      expect(result.key).toBe('guest-portrait-test.webp');
      expect(result.bucket).toBe('podcast-media-mahadev-2026');
      expect(result.etag).toBe('"mock-etag-12345"');
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('throws a sanitized error when S3 upload fails and refuses to proceed', async () => {
      vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(
        new Error('AccessDenied: User is not authorized with key AKIAIOSFODNN7EXAMPLE')
      );

      const buffer = Buffer.from('failed-data');
      await expect(
        uploadObjectToS3({
          key: 'fail.jpg',
          body: buffer,
          contentType: 'image/jpeg',
        })
      ).rejects.toThrow(/S3 upload failed for fail\.jpg/);
    });

    it('saveMediaFile uploads to S3 and returns S3 metadata when S3 is enabled', async () => {
      vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: any) => {
        if (command instanceof PutObjectCommand) {
          return { ETag: '"etag-saved-1"' } as any;
        }
        return {} as any;
      });

      const buffer = Buffer.from('podcast-episode-artwork');
      const res = await saveMediaFile(buffer, 'episode-101-art.png', 'image/png');

      expect(res.filename).toBe('episode-101-art.png');
      expect(res.s3Key).toBe('episode-101-art.png');
      expect(res.s3Bucket).toBe('podcast-media-mahadev-2026');
    });

    it('saveMediaFile strictly fails when S3 is enabled and S3 upload fails', async () => {
      vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(new Error('NetworkingError: Connection reset'));

      const buffer = Buffer.from('data-should-fail');
      await expect(saveMediaFile(buffer, 'network-fail.jpg', 'image/jpeg')).rejects.toThrow();
    });

    it('saveMediaFile streams to S3 and never writes to public/media when S3 is enabled', async () => {
      vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: any) => {
        if (command instanceof PutObjectCommand) {
          return { ETag: '"etag-saved-direct"' } as any;
        }
        return {} as any;
      });

      const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync');

      const buffer = Buffer.from('video-mp4-data');
      const res = await saveMediaFile(buffer, 'test-scene.mp4', 'video/mp4');

      expect(res.filename).toBe('test-scene.mp4');
      expect(res.s3Key).toBe('test-scene.mp4');

      // Assert that writeFileSync was never called for public/media
      const calls = writeFileSyncSpy.mock.calls;
      const wroteToPublicMedia = calls.some(([filePath]) =>
        typeof filePath === 'string' && filePath.includes(path.join('public', 'media'))
      );
      expect(wroteToPublicMedia).toBe(false);
    });
  });

  describe('4. Mocked S3 Retrieval & Delivery', () => {
    beforeEach(() => {
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_REGION = 'ap-south-1';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA_MOCK_TEST';
      process.env.AWS_SECRET_ACCESS_KEY = 'SECRET_MOCK_TEST';
      process.env.S3_ENABLED = 'true';
      resetS3Client();
    });

    it('retrieves an existing object from S3 with correct body and headers', async () => {
      const mockContent = Buffer.from('s3-image-payload-data');
      vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: any) => {
        if (command instanceof GetObjectCommand) {
          expect(command.input.Key).toBe('podcast-thumb.jpg');
          return {
            Body: Readable.from([mockContent]),
            ContentType: 'image/jpeg',
            ContentLength: mockContent.length,
            ETag: '"s3-etag-999"',
            LastModified: new Date('2026-10-23T10:00:00Z'),
          } as any;
        }
        return {} as any;
      });

      const obj = await getObjectFromS3('podcast-thumb.jpg');
      expect(obj).not.toBeNull();
      expect(obj!.buffer.toString()).toBe('s3-image-payload-data');
      expect(obj!.contentType).toBe('image/jpeg');
      expect(obj!.etag).toBe('"s3-etag-999"');
    });

    it('returns null gracefully when object is not found in S3 (NoSuchKey / 404)', async () => {
      const notFoundErr: any = new Error('The specified key does not exist.');
      notFoundErr.name = 'NoSuchKey';
      notFoundErr.$metadata = { httpStatusCode: 404 };

      vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(notFoundErr);

      const obj = await getObjectFromS3('nonexistent-file.png');
      expect(obj).toBeNull();
    });

    it('resolveMediaFile resolves from S3 when available', async () => {
      const mockContent = Buffer.from('resolved-from-s3');
      vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: any) => {
        if (command instanceof GetObjectCommand) {
          return {
            Body: Readable.from([mockContent]),
            ContentType: 'image/png',
            ContentLength: mockContent.length,
            ETag: '"etag-res-1"',
          } as any;
        }
        return {} as any;
      });

      const resolved = await resolveMediaFile('remote-asset.png');
      expect(resolved).not.toBeNull();
      expect(resolved!.source).toBe('s3');
      expect(resolved!.buffer.toString()).toBe('resolved-from-s3');
      expect(resolved!.contentType).toBe('image/png');
    });

    it('resolveMediaFile falls back to local disk when S3 returns null', async () => {
      const notFoundErr: any = new Error('NoSuchKey');
      notFoundErr.name = 'NoSuchKey';
      vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(notFoundErr);

      // Local placeholder file exists
      const resolved = await resolveMediaFile('portrait-placeholder.svg');
      expect(resolved).not.toBeNull();
      expect(resolved!.source).toBe('disk');
      expect(resolved!.contentType).toBe('image/svg+xml');
    });
  });

  describe('5. Mocked S3 Deletion', () => {
    beforeEach(() => {
      process.env.AWS_S3_BUCKET = 'podcast-media-mahadev-2026';
      process.env.AWS_REGION = 'ap-south-1';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA_MOCK_TEST';
      process.env.AWS_SECRET_ACCESS_KEY = 'SECRET_MOCK_TEST';
      process.env.S3_ENABLED = 'true';
      resetS3Client();
    });

    it('deletes an object from S3 using DeleteObjectCommand', async () => {
      const sendSpy = vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: any) => {
        if (command instanceof DeleteObjectCommand) {
          expect(command.input.Bucket).toBe('podcast-media-mahadev-2026');
          expect(command.input.Key).toBe('obsolete-asset.jpg');
          return {} as any;
        }
        return {} as any;
      });

      const deleted = await deleteObjectFromS3('obsolete-asset.jpg');
      expect(deleted).toBe(true);
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('deleteMediaFile deletes from S3 and candidate disk directories', async () => {
      vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as any);
      const res = await deleteMediaFile('temporary-delete-test.png');
      expect(res).toBe(true);
    });
  });

  describe('6. Local Development & Backward Compatibility', () => {
    it('finds existing local placeholder files without S3', () => {
      process.env.S3_ENABLED = 'false';
      const file = findMediaFile('portrait-placeholder.svg');
      expect(file).not.toBeNull();
    });

    it('determines correct MIME types for audio, video, image formats', () => {
      expect(getMimeType('track.mp3')).toBe('audio/mpeg');
      expect(getMimeType('track.wav')).toBe('audio/wav');
      expect(getMimeType('track.m4a')).toBe('audio/x-m4a');
      expect(getMimeType('video.mp4')).toBe('video/mp4');
      expect(getMimeType('video.webm')).toBe('video/webm');
      expect(getMimeType('image.webp')).toBe('image/webp');
      expect(getMimeType('image.jpg')).toBe('image/jpeg');
      expect(getMimeType('image.png')).toBe('image/png');
      expect(getMimeType('doc.pdf')).toBe('application/pdf');
    });
  });
});

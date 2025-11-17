import { generateTTS } from '../../lib/tts';

jest.mock('../../lib/storage', () => ({
  listFiles: jest.fn().mockResolvedValue([{ name: 'example.mp4', bucket: 'videos', size: 123 }]),
  uploadFile: jest.fn().mockResolvedValue({ name: 'upload.txt', bucket: 'assets', publicUrl: 'https://stub/upload.txt' }),
}));

describe('TTS placeholder', () => {
  it('gera metadados determinísticos', async () => {
    const res = await generateTTS({ text: 'Olá mundo teste', voice: 'br-pt-female' });
    expect(res.transcript).toContain('Olá');
    expect(res.durationMs).toBeGreaterThan(0);
    expect(res.metadata.words).toBeGreaterThan(2);
  });
});

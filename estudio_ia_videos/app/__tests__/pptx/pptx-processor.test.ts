import fs from 'node:fs';
import path from 'node:path';
import { processPPTXFile, validatePPTXFile } from '@/lib/pptx-processor';

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const fixturesDir = path.join(__dirname, 'fixtures');

const createFileFromBuffer = (buffer: Buffer, fileName: string) =>
  new File([buffer], fileName, { type: PPTX_MIME });

const loadFixture = (fileName: string) => {
  const fixturePath = path.join(fixturesDir, fileName);
  const buffer = fs.readFileSync(fixturePath);
  return createFileFromBuffer(buffer, fileName);
};

describe('validatePPTXFile', () => {
  it('deve aprovar um PPTX real válido', async () => {
    const file = loadFixture('multi-slide.pptx');
    const result = await validatePPTXFile(file);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deve rejeitar arquivos vazios', async () => {
    const emptyFile = new File([], 'empty.pptx', { type: PPTX_MIME });
    const result = await validatePPTXFile(emptyFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('vazio');
  });

  it('deve rejeitar arquivos maiores que 100MB', async () => {
    const buffer = Buffer.alloc(101 * 1024 * 1024, 0);
    const largeFile = createFileFromBuffer(buffer, 'very-large.pptx');
    const result = await validatePPTXFile(largeFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('muito grande');
  });

  it('deve rejeitar estruturas inválidas', async () => {
    const invalidFile = createFileFromBuffer(Buffer.from('conteúdo inválido'), 'invalid.pptx');
    const result = await validatePPTXFile(invalidFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Assinatura ZIP não encontrada');
  });
});

describe('processPPTXFile', () => {
  const projectId = 'pptx-processor-suite';

  it('deve retornar metadados e slides consistentes', async () => {
    const file = loadFixture('multi-slide.pptx');
    const result = await processPPTXFile(file, projectId);

    expect(result.success).toBe(true);
    expect(result.projectId).toBe(projectId);
    expect(result.metadata?.fileName).toBe('multi-slide.pptx');
    expect(result.metadata?.slideCount).toBe(result.slides?.length ?? 0);
    expect(result.metadata?.createdAt).toBeInstanceOf(Date);
    expect(result.thumbnails?.length).toBe(result.slides?.length ?? 0);
  });

  it('deve aplicar duração e transição customizadas', async () => {
    const file = loadFixture('multi-slide.pptx');
    const result = await processPPTXFile(file, projectId, {
      defaultDuration: 7,
      transition: { type: 'cut', duration: 0.25 },
    });

    expect(result.success).toBe(true);
    expect(result.slides).toBeDefined();
    result.slides?.forEach((slide) => {
      expect(slide.duration).toBe(7);
      expect(slide.transition).toMatchObject({ type: 'cut', duration: 0.25 });
    });
  });

  it('deve emitir os estágios corretos no callback de progresso', async () => {
    const file = loadFixture('multi-slide.pptx');
    const progressSpy = jest.fn();

    await processPPTXFile(file, projectId, {}, progressSpy);

    const stages = progressSpy.mock.calls.map(([payload]) => payload.stage);
    expect(stages).toEqual(['initializing', 'parsing', 'processing-slides', 'processing-slides', 'finalizing']);
  });

  it('deve falhar graciosamente quando a validação falha', async () => {
    const invalidFile = createFileFromBuffer(Buffer.from('pptx inválido'), 'broken.pptx');
    const result = await processPPTXFile(invalidFile, projectId);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.slides).toEqual([]);
    expect(result.thumbnails).toEqual([]);
  });
});
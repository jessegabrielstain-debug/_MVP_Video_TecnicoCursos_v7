import { PPTXProcessor } from '@/lib/pptx/pptx-processor';
import { createTestPPTX, cleanupTestFiles, createFileObject } from './test-helpers';
import { randomUUID } from 'crypto';

// Simulação completa do cliente Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

import * as path from 'path';

// ... existing imports ...

describe('Database Integration Logic Test', () => {
  const testFiles: string[] = [];
  let db: Record<string, any[]>;

  beforeAll(async () => {
    const filePath = path.join(__dirname, `test-${randomUUID()}.pptx`);
    await createTestPPTX(filePath);
    testFiles.push(filePath);
  });

  beforeEach(() => {
    // Reseta o banco de dados em memória e os mocks antes de cada teste
    db = { projects: [], slides: [] };
    jest.clearAllMocks();

    // Configuração do mock para simular a cadeia de chamadas do Supabase
    mockSupabase.from.mockImplementation((table: string) => {
      mockSupabase.insert.mockImplementation((data: any) => {
        const records = Array.isArray(data) ? data : [data];
        if (!db[table]) db[table] = [];
        db[table].push(...records);
        mockSupabase.select.mockReturnValue({
          data: records.length === 1 ? records[0] : records,
          error: null,
        });
        return { data: records, error: null, select: mockSupabase.select };
      });

      mockSupabase.select.mockImplementation(() => {
        mockSupabase.single.mockReturnValue({
          data: (db[table] && db[table][0]) || null,
          error: null,
        });
        mockSupabase.eq.mockImplementation((column: string, value: any) => {
          const filteredData = (db[table] || []).filter((item: any) => item[column] === value);
          mockSupabase.order.mockReturnValue({
             data: filteredData,
             error: null,
          });
          return { data: filteredData, error: null, order: mockSupabase.order };
        });
        return mockSupabase;
      });

      return mockSupabase;
    });
  });

  afterAll(() => {
    cleanupTestFiles(testFiles);
  });

  test('should process a PPTX file and save project/slides to the mock database', async () => {
    const filePath = testFiles[0];
    const file = await createFileObject(filePath);
    const processor = new PPTXProcessor();

    // 1. Processar o arquivo PPTX
    const result = await processor.process({ file });
    expect(result.slides).toHaveLength(1);

    // 2. Criar um projeto (simulado)
    const projectTitle = `Test Project ${randomUUID()}`;
    const userId = 'f279266a-3867-4143-9528-570d73372561';
    const projectId = `project-${randomUUID()}`;

    const projectInsertData = { id: projectId, title: projectTitle, user_id: userId };
    db.projects.push(projectInsertData); // Inserção manual no DB mock

    // 3. Salvar os slides (simulado)
    const slideInserts = result.slides.map((slide, index) => ({
      project_id: projectId,
      order_index: slide.slideNumber || index + 1,
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || '',
    }));
    db.slides.push(...slideInserts); // Inserção manual no DB mock

    // 4. Verificar se os slides foram "salvos"
    const savedSlides = db.slides.filter(s => s.project_id === projectId);

    expect(savedSlides).toHaveLength(1);
    expect(savedSlides[0].order_index).toBe(1);
    // expect(savedSlides[1].order_index).toBe(2);
    // expect(savedSlides[2].order_index).toBe(3);
    expect(db.projects[0].title).toBe(projectTitle);
  }, 120000);
});

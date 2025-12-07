/**
 * Teste de Validação Pós-Varredura
 * 
 * Valida as correções implementadas após a varredura profunda do projeto
 */


describe('Validação Pós-Varredura', () => {
  describe('Configurações de Ambiente', () => {
    it('deve ter credenciais do Supabase configuradas', () => {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      requiredVars.forEach(varName => {
        const value = process.env[varName];
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        expect(value).not.toContain('COLOQUE');
        expect(value).not.toContain('your_');
      });
    });

    it('deve ter URL do Supabase válida', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    });

    it('deve ter tokens JWT válidos', () => {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // JWT tem formato: xxxxx.yyyyy.zzzzz
      expect(anonKey?.split('.').length).toBe(3);
      expect(serviceKey?.split('.').length).toBe(3);
    });
  });

  describe('Estrutura do Projeto', () => {
    it('deve ter parsers PPTX disponíveis', () => {
      expect(() => require('@/lib/pptx/pptx-parser')).not.toThrow();
      expect(() => require('@/lib/pptx/pptx-processor')).not.toThrow();
    });

    it('deve ter definitions tipadas', () => {
      // Slide é uma interface, não existe em runtime, então apenas verificamos se o módulo carrega
      expect(() => require('@/lib/definitions')).not.toThrow();
    });
  });

  describe('Módulos ESM', () => {
    it('deve conseguir importar @supabase/supabase-js', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      expect(createClient).toBeDefined();
      expect(typeof createClient).toBe('function');
    });

    it('deve conseguir importar JSZip', async () => {
      const JSZip = (await import('jszip')).default;
      expect(JSZip).toBeDefined();
    });

    it('deve conseguir importar fast-xml-parser', async () => {
      const { XMLParser } = await import('fast-xml-parser');
      expect(XMLParser).toBeDefined();
    });
  });

  describe('Schemas e Validação', () => {
    it('deve ter Zod disponível', async () => {
      const { z } = await import('zod');
      expect(z).toBeDefined();
      expect(z.string).toBeDefined();
    });
  });
});

describe('Funcionalidades do Processador PPTX', () => {
  it('deve validar arquivo PPTX corretamente', async () => {
    const { validatePPTXFile } = await import('@/lib/pptx-processor');
    
    // Arquivo vazio deve falhar
    const emptyFile = new File([], 'empty.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const result = await validatePPTXFile(emptyFile);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('deve rejeitar arquivo muito grande', async () => {
    const { validatePPTXFile } = await import('@/lib/pptx-processor');
    
    // Criar arquivo > 100MB (simulado)
    const largeBuffer = new ArrayBuffer(101 * 1024 * 1024);
    const largeFile = new File([largeBuffer], 'large.pptx', { 
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    });
    
    const result = await validatePPTXFile(largeFile);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('muito grande');
  });
});

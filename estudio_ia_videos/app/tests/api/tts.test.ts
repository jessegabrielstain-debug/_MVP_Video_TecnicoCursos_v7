import { POST } from '@/app/api/tts/route';
import { TTSService } from '@/lib/tts/tts-service';
import { randomUUID } from 'crypto';

// Abordagem de Mock de Fábrica: A mais robusta para classes.
const mockGenerate = jest.fn();
jest.mock('@/lib/tts/tts-service', () => {
  // Retornamos um objeto que representa o módulo mockado.
  return {
    // A chave 'TTSService' corresponde à exportação nomeada que queremos mockar.
    TTSService: jest.fn().mockImplementation(() => {
      // O construtor mockado retorna um objeto com o método 'generate' mockado.
      return {
        generate: mockGenerate,
      };
    }),
  };
});

// Após o mock, fazemos o type assertion para ter o tipo correto com inteligência de mock.
const MockedTTSService = TTSService as jest.Mock;

describe('TTS API Route', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste para garantir isolamento.
    MockedTTSService.mockClear();
    mockGenerate.mockClear();
  });

  test('should return 400 for invalid request body', async () => {
    const invalidRequest = new Request('http://localhost/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: '', slideId: '' }), // Corpo inválido
    });

    const response = await POST(invalidRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  test('should return 500 if TTS generation fails', async () => {
    // Configura o mock para simular uma falha
    mockGenerate.mockResolvedValueOnce({
      error: 'Internal TTS Error',
    });

    const validRequest = new Request('http://localhost/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello world', slideId: randomUUID() }),
    });

    const response = await POST(validRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal TTS Error');
  });

  test('should return 200 with audio URL on successful generation', async () => {
    const mockAudioUrl = '/mock-audio/success.mp3';
    const mockDuration = 5.5;

    // Configura o mock para simular sucesso
    mockGenerate.mockResolvedValueOnce({
      audioUrl: mockAudioUrl,
      duration: mockDuration,
    });

    const slideId = randomUUID();
    const requestBody = { text: 'This is a successful test.', slideId };

    const validRequest = new Request('http://localhost/api/tts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(validRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.audioUrl).toBe(mockAudioUrl);
    expect(json.duration).toBe(mockDuration);
    expect(json.slideId).toBe(slideId);

    // Verifica se o construtor foi chamado
    expect(MockedTTSService).toHaveBeenCalledTimes(1);
    // Verifica se o método da instância foi chamado com o texto correto
    expect(mockGenerate).toHaveBeenCalledWith({
      text: requestBody.text,
    });
  });
});
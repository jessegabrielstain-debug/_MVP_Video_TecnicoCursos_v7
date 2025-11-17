import { supabase } from './client';

import type { Json } from './database.types';

type JsonRecord = Record<string, Json | undefined>;

// Invoca uma função Edge do Supabase
export const invokeFunction = async <TResponse = Json>(
  functionName: string,
  payload: JsonRecord = {}
): Promise<TResponse | null> => {
  const rawResponse = await supabase.functions.invoke<TResponse>(functionName, {
    body: payload,
  });

  if (typeof rawResponse !== 'object' || rawResponse === null) {
    throw new Error('Resposta inválida do Supabase Functions');
  }

  const { data, error } = rawResponse as {
    data: TResponse | null;
    error: unknown;
  };

  if (error) {
    throw error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'Erro desconhecido do Supabase Functions');
  }

  return data;
};

// Função para processar vídeos
export const processVideo = async <TResponse = Json>(
  videoUrl: string,
  metadata: JsonRecord
): Promise<TResponse | null> => {
  return await invokeFunction<TResponse>('process-video', {
    videoUrl,
    metadata,
  });
};

// Função para gerar thumbnails automaticamente
export const generateThumbnail = async <TResponse = Json>(videoUrl: string): Promise<TResponse | null> => {
  return await invokeFunction<TResponse>('generate-thumbnail', {
    videoUrl,
  });
};

// Função para transcrever vídeo
export const transcribeVideo = async <TResponse = Json>(
  videoUrl: string,
  language: string = 'pt-BR'
): Promise<TResponse | null> => {
  return await invokeFunction<TResponse>('transcribe-video', {
    videoUrl,
    language,
  });
};

// Função para enviar notificações
export const sendNotification = async <TResponse = Json>(
  userId: string,
  message: string,
  data: JsonRecord = {}
): Promise<TResponse | null> => {
  return await invokeFunction<TResponse>('send-notification', {
    userId,
    message,
    data,
  });
};

// Função para gerar relatórios
export const generateReport = async <TResponse = Json>(
  reportType: string,
  filters: JsonRecord = {}
): Promise<TResponse | null> => {
  return await invokeFunction<TResponse>('generate-report', {
    reportType,
    filters,
  });
};
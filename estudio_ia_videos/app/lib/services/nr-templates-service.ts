/**
 * Serviço para gerenciar templates de NRs (Normas Regulamentadoras)
 * 
 * @module nr-templates-service
 * @description Substitui mockNRTemplates por queries reais ao banco de dados
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/services/logger-service";
import { listNrTemplates as listMock, getNrTemplateByNumber as getMockByNr } from '@/lib/nr/catalog'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('NRTemplatesService', 'Credenciais do Supabase ausentes. Usando catálogo offline (mock) para NRs.');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface NRTemplate {
  id: string;
  nr_number: string;
  title: string;
  description: string | null;
  slide_count: number;
  duration_seconds: number;
  template_config: {
    themeColor?: string;
    fontFamily?: string;
    transitionType?: 'fade' | 'slide' | 'zoom';
    avatarEnabled?: boolean;
    avatarPosition?: 'bottom-left' | 'bottom-right' | 'center-bottom';
    audioEnabled?: boolean;
    subtitlesEnabled?: boolean;
    warningLevel?: 'low' | 'medium' | 'high' | 'critical';
    exampleImages?: string[];
  };
  created_at: string;
  updated_at: string;
}

function mapMockToNRTemplate(m: ReturnType<typeof listMock>[number]): NRTemplate {
  return {
    id: `mock-${m.nr_number}`,
    nr_number: m.nr_number,
    title: m.title,
    description: m.description,
    slide_count: m.slide_count,
    duration_seconds: m.duration_seconds,
    template_config: {
      themeColor: m.template_config.primary_color,
      fontFamily: m.template_config.font_family,
      transitionType: 'fade',
      avatarEnabled: false,
      avatarPosition: 'bottom-right',
      audioEnabled: false,
      subtitlesEnabled: true,
      warningLevel: 'medium',
      exampleImages: [],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Lista todos os templates de NRs disponíveis
 */
export async function listNRTemplates(): Promise<NRTemplate[]> {
  if (!supabase) {
    const mocks = listMock().map(mapMockToNRTemplate)
    logger.info('NRTemplatesService', 'Retornando templates NR via mock (Supabase ausente).', { count: mocks.length })
    return mocks
  }

  try {
    const { data, error } = await supabase
      .from('nr_templates')
      .select('*')
      .order('nr_number', { ascending: true });

    if (error) {
      // PGRST205: relation not found → fallback
      if (error.code === 'PGRST205') {
        const mocks = listMock().map(mapMockToNRTemplate)
        logger.warn('NRTemplatesService', 'Tabela nr_templates ausente. Usando catálogo mock.', { code: error.code })
        return mocks
      }
      logger.error('NRTemplatesService', "Falha ao listar templates de NRs.", error as Error, { error });
      throw error;
    }

    logger.info('NRTemplatesService', "Templates de NRs listados com sucesso.", { count: data.length });
    return data as NRTemplate[];
  } catch (error) {
    logger.error('NRTemplatesService', "Erro ao listar templates de NRs.", error as Error);
    // Fallback genérico em caso de erro inesperado
    const mocks = listMock().map(mapMockToNRTemplate)
    logger.warn('NRTemplatesService', 'Erro ao consultar Supabase. Usando catálogo mock.', { err: String(error) })
    return mocks
  }
}

/**
 * Busca um template de NR específico pelo número
 */
export async function getNRTemplate(nrNumber: string): Promise<NRTemplate | null> {
  if (!supabase) {
    const mock = getMockByNr(nrNumber)
    if (!mock) return null
    return mapMockToNRTemplate(mock)
  }

  try {
    const { data, error } = await supabase
      .from('nr_templates')
      .select('*')
      .eq('nr_number', nrNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        logger.warn('NRTemplatesService', "Template de NR não encontrado.", { nrNumber });
        // Tenta fallback mock
        const mock = getMockByNr(nrNumber)
        return mock ? mapMockToNRTemplate(mock) : null
      }
      if (error.code === 'PGRST205') {
        const mock = getMockByNr(nrNumber)
        return mock ? mapMockToNRTemplate(mock) : null
      }
      logger.error('NRTemplatesService', "Falha ao buscar template de NR.", error as Error, { nrNumber });
      throw error;
    }

    logger.info('NRTemplatesService', "Template de NR encontrado.", { nrNumber });
    return data as NRTemplate;
  } catch (error) {
    logger.error('NRTemplatesService', "Erro ao buscar template de NR.", error as Error, { nrNumber });
    const mock = getMockByNr(nrNumber)
    return mock ? mapMockToNRTemplate(mock) : null
  }
}

/**
 * Cria um novo template de NR (apenas admins)
 */
export async function createNRTemplate(
  template: Omit<NRTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<NRTemplate> {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  try {
    const { data, error } = await supabase
      .from('nr_templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      logger.error('NRTemplatesService', "Falha ao criar template de NR.", error as Error, { template });
      throw error;
    }

    logger.info('NRTemplatesService', "Template de NR criado com sucesso.", { nrNumber: data.nr_number });
    return data;
  } catch (error) {
    logger.error('NRTemplatesService', "Erro ao criar template de NR.", error as Error);
    throw error;
  }
}

/**
 * Atualiza um template de NR existente (apenas admins)
 */
export async function updateNRTemplate(
  id: string,
  updates: Partial<Omit<NRTemplate, 'id' | 'created_at' | 'updated_at'>>
): Promise<NRTemplate> {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  try {
    const { data, error } = await supabase
      .from('nr_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('NRTemplatesService', "Falha ao atualizar template de NR.", error as Error, { id, updates });
      throw error;
    }

    logger.info('NRTemplatesService', "Template de NR atualizado com sucesso.", { id, nrNumber: data.nr_number });
    return data;
  } catch (error) {
    logger.error('NRTemplatesService', "Erro ao atualizar template de NR.", error as Error, { id });
    throw error;
  }
}

/**
 * Deleta um template de NR (apenas admins)
 */
export async function deleteNRTemplate(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  try {
    const { error } = await supabase
      .from('nr_templates')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('NRTemplatesService', "Falha ao deletar template de NR.", error as Error, { id });
      throw error;
    }

    logger.info('NRTemplatesService', "Template de NR deletado com sucesso.", { id });
  } catch (error) {
    logger.error('NRTemplatesService', "Erro ao deletar template de NR.", error as Error, { id });
    throw error;
  }
}

/**
 * Busca templates por texto (título ou descrição)
 */
export async function searchNRTemplates(query: string): Promise<NRTemplate[]> {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  try {
    const { data, error } = await supabase
      .from('nr_templates')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('nr_number', { ascending: true });

    if (error) {
      logger.error('NRTemplatesService', "Falha ao buscar templates de NRs.", error as Error, { query });
      throw error;
    }

    logger.info('NRTemplatesService', "Busca de templates concluída.", { query, count: data.length });
    return data;
  } catch (error) {
    logger.error('NRTemplatesService', "Erro ao buscar templates de NRs.", error as Error, { query });
    throw error;
  }
}

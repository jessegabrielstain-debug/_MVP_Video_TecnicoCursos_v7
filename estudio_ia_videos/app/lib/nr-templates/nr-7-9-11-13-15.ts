/**
 * NR Templates: 7, 9, 11, 13, 15
 * Templates para Normas Regulamentadoras específicas
 */

export interface NRTemplate {
  number: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    required: boolean;
  }>;
}

export const NR_7: NRTemplate = {
  number: 'NR-7',
  title: 'Programas de Controle Médico de Saúde Ocupacional',
  sections: [],
};

export const NR_9: NRTemplate = {
  number: 'NR-9',
  title: 'Avaliação e Controle das Exposições Ocupacionais',
  sections: [],
};

export const NR_11: NRTemplate = {
  number: 'NR-11',
  title: 'Transporte, Movimentação, Armazenagem e Manuseio de Materiais',
  sections: [],
};

export const NR_13: NRTemplate = {
  number: 'NR-13',
  title: 'Caldeiras, Vasos de Pressão e Tubulações',
  sections: [],
};

export const NR_15: NRTemplate = {
  number: 'NR-15',
  title: 'Atividades e Operações Insalubres',
  sections: [],
};

export const getAllTemplates = () => [NR_7, NR_9, NR_11, NR_13, NR_15];

export const NEW_NR_TEMPLATES = {
  'NR-7': NR_7,
  'NR-9': NR_9,
  'NR-11': NR_11,
  'NR-13': NR_13,
  'NR-15': NR_15,
};

export const NR_TEMPLATES_METADATA = {
  'NR-7': { version: '2024', lastUpdate: '2024-01-01' },
  'NR-9': { version: '2024', lastUpdate: '2024-01-01' },
  'NR-11': { version: '2024', lastUpdate: '2024-01-01' },
  'NR-13': { version: '2024', lastUpdate: '2024-01-01' },
  'NR-15': { version: '2024', lastUpdate: '2024-01-01' },
};

/**
 * Testes do Sistema de Logging
 */

import { logger } from '../estudio_ia_videos/app/lib/services';

console.log('\n🧪 Testando Sistema de Logging...\n');

// Testes de diferentes níveis
logger.debug('TestComponent', 'Mensagem de debug', { userId: 123 });
logger.info('TestComponent', 'Mensagem informativa', { action: 'login' });
logger.warn('TestComponent', 'Aviso importante', { memoryUsage: '85%' });
logger.error('TestComponent', 'Erro detectado', new Error('Test error'), { code: 500 });
logger.fatal('TestComponent', 'Erro fatal!', new Error('Fatal error'), { system: 'crashed' });

// Mais logs para análise
logger.info('DatabaseService', 'Conectado ao banco de dados');
logger.info('AuthService', 'Usuário autenticado', { userId: 456 });
logger.warn('CacheService', 'Cache expirando em breve');
logger.info('RenderService', 'Vídeo renderizado com sucesso', { videoId: 789 });

// Teste de análise
setTimeout(() => {
  console.log('\n📊 Analisando logs...\n');
  const analysis = logger.analyzeLogs();
  logger.printAnalysis(analysis);

  // Teste de busca
  console.log('🔍 Buscando erros...\n');
  const errors = logger.searchLogs('', 'ERROR');
  console.log(`Encontrados ${errors.length} erros:\n`);
  errors.forEach(error => {
    console.log(`   [${error.timestamp}] ${error.message}`);
  });

  console.log('\n✅ Testes concluídos!\n');
  console.log(`📂 Logs salvos em: logs/\n`);
}, 1000);

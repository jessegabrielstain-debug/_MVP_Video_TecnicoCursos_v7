// @ts-nocheck
/**
 * 🚀 INITIALIZE UNIFIED SYSTEM
 * 
 * Script de inicialização do sistema unificado.
 * Use este script para iniciar o aplicativo integrado.
 * 
 * @version 1.0.0
 * @date 08/10/2025
 */

import { initializeUnifiedSystem } from '../lib/integration';
import { validateConfiguration } from '../lib/integration/unified-config';

async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 VALIDANDO CONFIGURAÇÃO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Validar configuração
    const validation = validateConfiguration();
    
    if (!validation.valid) {
      console.error('❌ Erros de configuração encontrados:');
      (validation.errors || []).forEach((error: string) => console.error(`  - ${error}`));
      console.log('');
      process.exit(1);
    }

    console.log('✅ Configuração válida');
    console.log('');

    // Inicializar sistema
    const app = await initializeUnifiedSystem();

    // Configurar handlers de shutdown graceful
    process.on('SIGTERM', async () => {
      console.log('');
      console.log('Recebido SIGTERM, desligando...');
      await app.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('');
      console.log('Recebido SIGINT, desligando...');
      await app.shutdown();
      process.exit(0);
    });

    // Manter processo ativo
    process.on('uncaughtException', (error) => {
      console.error('');
      console.error('❌ Exceção não capturada:', error);
      console.error('');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('');
      console.error('❌ Promise rejeitada não tratada:', reason);
      console.error('');
    });

  } catch (error) {
    console.error('');
    console.error('❌ Erro fatal durante inicialização:', error);
    console.error('');
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

export default main;

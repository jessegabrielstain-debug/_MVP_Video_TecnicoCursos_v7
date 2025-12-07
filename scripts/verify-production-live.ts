
import fetch from 'node-fetch';

async function verifyLive() {
  console.log('🔍 Verificando status da aplicação em produção...');
  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Health Check
    console.log(`\n1. Testando Health Check (${baseUrl}/api/health)...`);
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.log(`Status: ${healthRes.status}`);
    if (healthRes.status === 200) {
      const data = await healthRes.json();
      console.log('✅ Health Check OK:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Health Check Falhou:', await healthRes.text());
      process.exit(1);
    }

    // 2. Home Page
    console.log(`\n2. Testando Home Page (${baseUrl})...`);
    const homeRes = await fetch(baseUrl);
    console.log(`Status: ${homeRes.status}`);
    if (homeRes.status === 200) {
      console.log('✅ Home Page Acessível');
    } else {
      console.error('❌ Home Page Falhou');
      process.exit(1);
    }

    console.log('\n🎉 APLICAÇÃO ESTÁ RODANDO CORRETAMENTE EM PRODUÇÃO!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    process.exit(1);
  }
}

verifyLive();

#!/usr/bin/env node

/**
 * Script para testar credenciais TTS
 * Testa conectividade com Azure Speech Services e ElevenLabs
 */

import dotenv from 'dotenv';
import https from 'https';
import { fileURLToPath } from 'url';

dotenv.config({ path: 'estudio_ia_videos/.env.local' });

async function testAzureSpeech() {
  console.log('🔍 Testando Azure Speech Services...');
  
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  
  if (!key || !region) {
    console.log('❌ Credenciais Azure não encontradas');
    return false;
  }
  
  console.log(`📍 Região: ${region}`);
  console.log(`🔑 Chave: ${key.substring(0, 10)}...`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: `${region}.api.cognitive.microsoft.com`,
      port: 443,
      path: '/sts/v1.0/issuetoken',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Length': 0
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Azure Speech Services: Conectado com sucesso');
        resolve(true);
      } else {
        console.log(`❌ Azure Speech Services: Erro ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log(`❌ Azure Speech Services: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Azure Speech Services: Timeout');
      resolve(false);
    });
    
    req.end();
  });
}

async function testElevenLabs() {
  console.log('\n🔍 Testando ElevenLabs API...');
  
  const key = process.env.ELEVENLABS_API_KEY;
  
  if (!key) {
    console.log('❌ Chave ElevenLabs não encontrada');
    return false;
  }
  
  console.log(`🔑 Chave: ${key.substring(0, 10)}...`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: '/v1/user',
      method: 'GET',
      headers: {
        'xi-api-key': key
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ ElevenLabs API: Conectado com sucesso');
        resolve(true);
      } else {
        console.log(`❌ ElevenLabs API: Erro ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log(`❌ ElevenLabs API: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ ElevenLabs API: Timeout');
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  console.log('🚀 Testando credenciais TTS...\n');
  
  const azureResult = await testAzureSpeech();
  const elevenLabsResult = await testElevenLabs();
  
  console.log('\n📊 Resumo dos testes:');
  console.log(`Azure Speech Services: ${azureResult ? '✅ OK' : '❌ FALHA'}`);
  console.log(`ElevenLabs API: ${elevenLabsResult ? '✅ OK' : '❌ FALHA'}`);
  
  if (azureResult && elevenLabsResult) {
    console.log('\n🎉 Todas as credenciais TTS estão funcionando!');
    console.log('\n📋 Próximos passos:');
    console.log('  1. Reinicie o servidor de desenvolvimento');
    console.log('  2. Teste a geração de áudio na interface');
    console.log('  3. Verifique os logs de TTS em tempo real');
  } else {
    console.log('\n⚠️ Algumas credenciais precisam ser verificadas');
    console.log('Verifique as chaves de API e conectividade de rede');
  }
}

// Executar teste
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
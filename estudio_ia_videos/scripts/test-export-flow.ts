
import path from 'path';
import dotenv from 'dotenv';

// Load env vars BEFORE importing services
const envPath = path.join(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

// Verify env vars are loaded
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.error('❌ AWS_ACCESS_KEY_ID not found in environment!');
  process.exit(1);
}

async function testRender() {
  // Dynamic import to ensure env vars are loaded first
  const { RenderService } = await import('../app/lib/services/render-service');

  console.log('🚀 Iniciando Teste de Exportação (Force Mode)...');
  
  const projectId = 'test-project-' + Date.now();
  
  const mockSlides = [
    {
      id: 'slide-1',
      title: 'Teste de Renderização',
      content: 'Se você está vendo isso, o pipeline funciona!',
      duration: 3, // 3 segundos
      backgroundImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80'
    },
    {
      id: 'slide-2',
      title: 'Slide 2',
      content: 'Testando transições e upload S3.',
      duration: 3
    }
  ];

  try {
    console.log(`🎥 Renderizando projeto: ${projectId}`);
    console.log(`📊 Slides: ${mockSlides.length}`);
    
    // Cast para compatibilidade com o tipo Slide do serviço
    const result = await RenderService.renderVideo(projectId, mockSlides as Parameters<typeof RenderService.renderVideo>[1]);
    
    console.log('\n✅ SUCESSO TOTAL!');
    console.log('--------------------------------------------------');
    console.log('🔗 URL do Vídeo:', result.videoUrl);
    console.log('🔑 S3 Key:', result.s3Key);
    console.log('--------------------------------------------------');
    
  } catch (error) {
    console.error('\n❌ FALHA NO TESTE:', error);
    process.exit(1);
  }
}

testRender();


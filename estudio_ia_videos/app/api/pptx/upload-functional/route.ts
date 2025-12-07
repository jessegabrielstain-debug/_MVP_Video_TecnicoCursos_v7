import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validações
    const validExtensions = ['.pptx', '.ppt'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Apenas arquivos .pptx e .ppt são aceitos' },
        { status: 400 }
      );
    }

    // Verificar tamanho (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 50MB' },
        { status: 400 }
      );
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(process.cwd(), 'uploads', 'pptx');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${timestamp}_${randomId}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retornar informações do arquivo
    const fileInfo = {
      id: `${timestamp}_${randomId}`,
      originalName: file.name,
      fileName: uniqueFileName,
      size: file.size,
      type: file.type,
      uploadPath: filePath,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded'
    };

    return NextResponse.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      file: fileInfo
    });

  } catch (error: unknown) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de Upload PPTX',
    endpoints: {
      POST: 'Upload de arquivo PPTX',
      maxFileSize: '50MB',
      supportedFormats: ['.pptx', '.ppt']
    }
  });
}

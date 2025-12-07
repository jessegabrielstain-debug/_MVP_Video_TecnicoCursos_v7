// TODO: Fix ProcessedImage type property names

/**
 * 🖼️ API de Processamento Real de Imagens
 */

import { NextRequest, NextResponse } from 'next/server'
import { imageProcessor, processProjectImages } from '@/lib/image-processor-real'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const projectId = formData.get('projectId') as string
    const optionsStr = formData.get('options') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada' },
        { status: 400 }
      )
    }

    console.log(`🖼️ Processando ${files.length} imagens`)

    // Parse das opções se fornecidas
    const options = optionsStr ? JSON.parse(optionsStr) : {}

    let results
    if (projectId) {
      // Processar imagens para um projeto específico
      const projectResult = await processProjectImages(projectId, files, options)
      if (!projectResult.success) {
        throw new Error(projectResult.error)
      }
      results = projectResult.processedImages || []
    } else {
      // Processamento individual
      results = await imageProcessor.processBatchImages(files, options)
    }

    return NextResponse.json({
      success: true,
      processedImages: results,
      count: results.length,
      message: `${results.length} imagens processadas com sucesso!`
    })

  } catch (error) {
    console.error('❌ Erro no processamento de imagens:', error)
    return NextResponse.json(
      { 
        error: 'Erro no processamento de imagens',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'optimize') {
      // Exemplo de otimização para web
      const imageUrl = searchParams.get('imageUrl')
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'URL da imagem é obrigatória' },
          { status: 400 }
        )
      }

      // Buscar imagem da URL e otimizar
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      
      const optimized = await imageProcessor.optimizeForWeb(imageBuffer)

      return NextResponse.json({
        success: true,
        optimized: {
          sizes: optimized.sizes,
          savings: {
            webp: Math.round(((optimized.sizes.original - optimized.sizes.webp) / optimized.sizes.original) * 100),
            jpeg: Math.round(((optimized.sizes.original - optimized.sizes.jpeg) / optimized.sizes.original) * 100)
          }
        },
        message: 'Imagem otimizada com sucesso!'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'API de processamento de imagens ativa',
      endpoints: {
        POST: '/api/v1/images/process-real - Processar imagens',
        GET: '/api/v1/images/process-real?action=optimize&imageUrl=... - Otimizar imagem'
      }
    })

  } catch (error) {
    console.error('❌ Erro na otimização de imagem:', error)
    return NextResponse.json(
      { 
        error: 'Erro na otimização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}


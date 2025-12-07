#!/usr/bin/env tsx
// TODO: Script - fix types

/**
 * Script para criar um arquivo PPTX de teste válido
 * FASE 1: PPTX Processing Real
 */

import PptxGenJS from 'pptxgenjs'
import fs from 'fs'
import path from 'path'

async function createTestPPTX() {
  console.log('🎯 Criando arquivo PPTX de teste...')

  try {
    // Criar nova apresentação
    const pptx = new PptxGenJS()

    // Configurar propriedades da apresentação
    pptx.author = 'Sistema de Teste'
    pptx.company = 'Estudio IA Videos'
    pptx.title = 'Apresentação de Teste - PPTX Processing'
    pptx.subject = 'Teste de processamento real de PPTX'

    // Slide 1: Título
    const slide1 = pptx.addSlide()
    slide1.addText('Apresentação de Teste', {
      x: 1,
      y: 1,
      w: 8,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: '363636',
      align: 'center'
    })
    slide1.addText('PPTX Processing Real - Fase 1', {
      x: 1,
      y: 3,
      w: 8,
      h: 1,
      fontSize: 24,
      color: '666666',
      align: 'center'
    })
    slide1.addText('Sistema de processamento de apresentações PowerPoint', {
      x: 1,
      y: 4.5,
      w: 8,
      h: 0.8,
      fontSize: 16,
      color: '888888',
      align: 'center'
    })

    // Slide 2: Lista com bullets
    const slide2 = pptx.addSlide()
    slide2.addText('Funcionalidades Implementadas', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '363636'
    })
    
    const bulletPoints = [
      'Extração real de texto e formatação',
      'Processamento de imagens e assets',
      'Detecção automática de layouts',
      'Geração de timeline de apresentação',
      'Upload para S3 com thumbnails',
      'Integração com banco de dados Prisma'
    ]

    bulletPoints.forEach((point, index) => {
      slide2.addText(`• ${point}`, {
        x: 1,
        y: 2 + (index * 0.6),
        w: 8,
        h: 0.5,
        fontSize: 18,
        color: '444444'
      })
    })

    // Slide 3: Dados técnicos
    const slide3 = pptx.addSlide()
    slide3.addText('Especificações Técnicas', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '363636'
    })

    slide3.addText('Tecnologias Utilizadas:', {
      x: 1,
      y: 2,
      w: 4,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: '555555'
    })

    const techList = [
      'Next.js + TypeScript',
      'Prisma ORM',
      'AWS S3 Storage',
      'Sharp (processamento de imagens)',
      'JSZip (manipulação de arquivos)',
      'XML2JS (parsing de XML)'
    ]

    techList.forEach((tech, index) => {
      slide3.addText(`→ ${tech}`, {
        x: 1.5,
        y: 2.8 + (index * 0.4),
        w: 6,
        h: 0.3,
        fontSize: 14,
        color: '666666'
      })
    })

    // Slide 4: Estatísticas
    const slide4 = pptx.addSlide()
    slide4.addText('Métricas de Performance', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '363636'
    })

    // Adicionar tabela com métricas
    const tableData = [
      ['Métrica', 'Valor', 'Unidade'],
      ['Tempo de processamento', '< 5', 'segundos'],
      ['Slides suportados', '100+', 'slides'],
      ['Formatos de imagem', '7', 'tipos'],
      ['Tamanho máximo', '50', 'MB'],
      ['Precisão de extração', '95%', 'texto']
    ]

    slide4.addTable(tableData as any, {
      x: 1,
      y: 2,
      w: 8,
      h: 3,
      fontSize: 14,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F8F9FA' }
    })

    // Slide 5: Notas do apresentador
    const slide5 = pptx.addSlide()
    slide5.addText('Conclusão', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '363636'
    })

    slide5.addText('O sistema de processamento PPTX real foi implementado com sucesso, oferecendo extração completa de conteúdo, processamento de imagens e integração com serviços de nuvem.', {
      x: 1,
      y: 2,
      w: 8,
      h: 2,
      fontSize: 18,
      color: '444444',
      align: 'justify'
    })

    slide5.addText('Próximos passos: otimização de performance e suporte a elementos avançados.', {
      x: 1,
      y: 4.5,
      w: 8,
      h: 1,
      fontSize: 16,
      color: '666666',
      italic: true
    })

    // Adicionar notas do apresentador
    slide5.addNotes('Esta apresentação demonstra as capacidades do sistema de processamento PPTX real. O sistema é capaz de extrair texto, imagens, layouts e metadados de apresentações PowerPoint de forma automatizada.')

    // Salvar arquivo
    const outputPath = path.join(process.cwd(), '..', 'test-presentation.pptx')
    
    console.log('💾 Salvando apresentação...')
    await pptx.writeFile({ fileName: outputPath })
    
    // Verificar se o arquivo foi criado
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath)
      console.log(`✅ Arquivo PPTX criado com sucesso!`)
      console.log(`📁 Localização: ${outputPath}`)
      console.log(`📊 Tamanho: ${(stats.size / 1024).toFixed(2)} KB`)
      console.log(`📄 Slides: 5`)
      console.log(`🎯 Pronto para teste de processamento!`)
    } else {
      throw new Error('Arquivo não foi criado')
    }

  } catch (error) {
    console.error('❌ Erro ao criar PPTX de teste:', error)
    process.exit(1)
  }
}

// Executar criação
if (require.main === module) {
  createTestPPTX()
    .then(() => {
      console.log('\n🎉 Arquivo PPTX de teste criado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro na criação:', error)
      process.exit(1)
    })
}

export { createTestPPTX }
#!/usr/bin/env tsx

/**
 * Script de debug para analisar a estrutura XML do PPTX
 * FASE 1: PPTX Processing Real
 */

import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'
import { parseStringPromise } from 'xml2js'

type XmlLeaf = string | number | boolean | null
type XmlValue = XmlLeaf | XmlValue[] | { [key: string]: XmlValue }

const isXmlRecord = (value: XmlValue | undefined): value is Record<string, XmlValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const toArray = (value: XmlValue | undefined): XmlValue[] => {
  if (Array.isArray(value)) {
    return value
  }

  if (value === undefined || value === null) {
    return []
  }

  return [value]
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') {
      return maybeMessage
    }
  }

  return 'Unknown error'
}

async function debugPPTXStructure() {
  console.log('🔍 Analisando estrutura XML do PPTX...\n')

  try {
    // Caminho para o arquivo PPTX de teste
    const testPptxPath = path.join(process.cwd(), '..', 'test-presentation.pptx')
    
    if (!fs.existsSync(testPptxPath)) {
      throw new Error(`Arquivo PPTX não encontrado: ${testPptxPath}`)
    }

    // Ler o arquivo PPTX
    const pptxBuffer = fs.readFileSync(testPptxPath)
    const zip = await JSZip.loadAsync(pptxBuffer)

    console.log('📁 ARQUIVOS NO PPTX:')
    Object.keys(zip.files).forEach(filename => {
      console.log(`  - ${filename}`)
    })

    // Analisar slide 1
    console.log('\n🔍 ANALISANDO SLIDE 1:')
    const slide1File = zip.file('ppt/slides/slide1.xml')
    
    if (slide1File) {
      const slide1Xml = await slide1File.async('text')
      console.log('\n📄 XML do Slide 1 (primeiros 1000 caracteres):')
      console.log(slide1Xml.substring(0, 1000) + '...')
      
      // Parse do XML
      const slide1Data = (await parseStringPromise(slide1Xml)) as XmlValue
      console.log('\n🔧 ESTRUTURA PARSEADA:')
      console.log(JSON.stringify(slide1Data, null, 2).substring(0, 2000) + '...')
      
      // Procurar por texto
      console.log('\n🔍 PROCURANDO TEXTO:')
      const findText = (obj: XmlValue, currentPath: string = ''): void => {
        if (!isXmlRecord(obj)) return
        
        Object.keys(obj).forEach(key => {
          const nextPath = currentPath ? `${currentPath}.${key}` : key
          const value = obj[key]
          
          if (key === 'a:t' && typeof value === 'string') {
            console.log(`  📝 Texto encontrado em ${nextPath}: "${value}"`)
          }
          
          if (typeof value === 'object' && value !== null) {
            toArray(value).forEach((item, index) => {
              const arrayPath = Array.isArray(value) ? `${nextPath}[${index}]` : nextPath
              findText(item, arrayPath)
            })
          }
        })
      }
      
      findText(slide1Data)
      
      // Procurar por shapes
      console.log('\n🔍 PROCURANDO SHAPES:')
      const findShapes = (obj: XmlValue, currentPath: string = ''): void => {
        if (!isXmlRecord(obj)) return
        
        Object.keys(obj).forEach(key => {
          const nextPath = currentPath ? `${currentPath}.${key}` : key
          const value = obj[key]
          
          if (key === 'p:sp') {
            console.log(`  🔷 Shape encontrado em ${nextPath}`)
            toArray(value).forEach((shape, index) => {
              if (!isXmlRecord(shape)) return
              console.log(`    Shape ${index + 1}:`)

              const txBody = shape['p:txBody']
              if (txBody) {
                console.log('      - Tem texto body')
                findText(txBody, `${nextPath}[${index}].p:txBody`)
              }

              const nvSpPr = shape['p:nvSpPr']
              if (nvSpPr && isXmlRecord(nvSpPr)) {
                const cNvPrValue = nvSpPr['p:cNvPr']
                const cNvPrArray = toArray(cNvPrValue)
                const first = cNvPrArray[0]

                if (isXmlRecord(first)) {
                  const attributes = first.$
                  if (isXmlRecord(attributes)) {
                    const nameAttribute = attributes.name
                    if (typeof nameAttribute === 'string') {
                      console.log(`      - Nome: ${nameAttribute}`)
                    }
                  }
                }
              }
            })
          }
          
          if (typeof value === 'object' && value !== null) {
            toArray(value).forEach((item, index) => {
              const arrayPath = Array.isArray(value) ? `${nextPath}[${index}]` : nextPath
              findShapes(item, arrayPath)
            })
          }
        })
      }
      
      findShapes(slide1Data)
      
    } else {
      console.log('❌ Slide 1 não encontrado')
    }

    // Verificar content types
    console.log('\n📋 CONTENT TYPES:')
    const contentTypesFile = zip.file('[Content_Types].xml')
    if (contentTypesFile) {
      const contentTypesXml = await contentTypesFile.async('text')
      const contentTypesData = await parseStringPromise(contentTypesXml)
      console.log(JSON.stringify(contentTypesData, null, 2))
    }

  } catch (error) {
    console.error('❌ Erro durante análise:', getErrorMessage(error))
    process.exit(1)
  }
}

// Executar debug
if (require.main === module) {
  debugPPTXStructure()
    .then(() => {
      console.log('\n✅ Análise de estrutura concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro na análise:', getErrorMessage(error))
      process.exit(1)
    })
}

export { debugPPTXStructure }
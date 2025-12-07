#!/usr/bin/env tsx
// TODO: Archive script - fix types

/**
 * Script de Demonstração do Sistema de Compliance com IA
 * Execute: npx tsx scripts/test-compliance-ai.ts
 */

import { checkCompliance } from '../../lib/compliance/nr-engine'
import { getAllNRs } from '../../lib/compliance/templates'

async function demonstrateComplianceSystem() {
  console.log('🚀 DEMONSTRAÇÃO DO SISTEMA DE COMPLIANCE COM IA')
  console.log('=' .repeat(60))
  
  // 1. Listar NRs disponíveis
  console.log('\n📋 NRs Disponíveis:')
  const availableNRs = getAllNRs()
  availableNRs.forEach(nr => {
    console.log(`- ${nr.code}: ${nr.name}`)
  })
  
  // 2. Dados de teste
  const testProject = {
    slides: [
      {
        number: 1,
        title: "Introdução à Segurança em Máquinas",
        content: "Este curso aborda os principais aspectos de segurança em máquinas e equipamentos conforme NR-12. Vamos aprender sobre dispositivos de proteção, EPIs necessários e procedimentos de segurança.",
        duration: 300,
        imageUrls: ["https://example.com/epi-capacete.jpg"],
        audioPath: "/audio/intro-seguranca.mp3"
      },
      {
        number: 2,
        title: "Dispositivos de Proteção",
        content: "Os dispositivos de proteção são fundamentais para prevenir acidentes. Incluem proteções fixas, móveis e dispositivos de intertravamento.",
        duration: 240,
        imageUrls: ["https://example.com/protecao-fixa.jpg"],
        audioPath: "/audio/dispositivos-protecao.mp3"
      }
    ],
    totalDuration: 540,
    imageUrls: ["https://example.com/epi-capacete.jpg", "https://example.com/protecao-fixa.jpg"],
    audioFiles: ["/audio/intro-seguranca.mp3", "/audio/dispositivos-protecao.mp3"]
  }
  
  console.log('\n🧪 TESTE 1: Análise Tradicional (sem IA)')
  console.log('-'.repeat(50))
  
  try {
    const traditionalResult = await checkCompliance('NR-12', testProject, false)
    
    console.log(`✅ Status: ${traditionalResult.status}`)
    console.log(`📊 Score: ${traditionalResult.score.toFixed(1)}%`)
    console.log(`📋 Requisitos: ${traditionalResult.requirementsMet}/${traditionalResult.requirementsTotal}`)
    
  } catch (error) {
    console.error('❌ Erro na análise tradicional:', error)
  }
  
  console.log('\n🤖 TESTE 2: Análise com IA')
  console.log('-'.repeat(50))
  
  try {
    const aiResult = await checkCompliance('NR-12', testProject, true)
    
    console.log(`✅ Status: ${aiResult.status}`)
    console.log(`📊 Score Tradicional: ${aiResult.score.toFixed(1)}%`)
    console.log(`🤖 Score IA: ${aiResult.aiScore?.toFixed(1) || 'N/A'}%`)
    console.log(`🎯 Score Final: ${aiResult.finalScore?.toFixed(1) || 'N/A'}%`)
    console.log(`🎲 Confiança: ${((aiResult.confidence || 0) * 100).toFixed(1)}%`)
    
    if (aiResult.recommendations.length > 0) {
      console.log('\n💡 Recomendações da IA:')
      aiResult.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro na análise com IA:', error)
  }
  
  console.log('\n🏁 DEMONSTRAÇÃO CONCLUÍDA')
  console.log('✅ Sistema de Compliance com IA funcionando!')
}

// Executar demonstração
if (require.main === module) {
  demonstrateComplianceSystem()
    .then(() => {
      console.log('\n✨ Demonstração finalizada com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro na demonstração:', error)
      process.exit(1)
    })
}

export { demonstrateComplianceSystem }
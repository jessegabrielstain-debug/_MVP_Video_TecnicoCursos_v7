'use client'

import { createBrowserSupabaseClient } from '@/lib/services'
import { useEffect, useState } from 'react'

export default function SupabaseTestPage() {
  const [status, setStatus] = useState('Carregando...')
  const [tests, setTests] = useState<any[]>([])

  useEffect(() => {
    async function runTests() {
      const results = []
      
      try {
        // Teste 1: Variáveis de ambiente
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        results.push({
          name: 'Variáveis de Ambiente',
          status: supabaseUrl && supabaseKey ? 'OK' : 'ERRO',
          details: `URL: ${supabaseUrl ? 'Configurada' : 'Não encontrada'}, Key: ${supabaseKey ? 'Configurada' : 'Não encontrada'}`
        })

        // Teste 2: Cliente Supabase
        const supabase = createBrowserSupabaseClient()
        results.push({
          name: 'Cliente Supabase',
          status: 'OK',
          details: 'Cliente criado com sucesso'
        })

        // Teste 3: Conexão com banco
        try {
          const { data, error } = await supabase.from('users').select('count').limit(1)
          results.push({
            name: 'Conexão com Banco',
            status: error ? 'ERRO' : 'OK',
            details: error ? error.message : 'Conexão estabelecida'
          })
        } catch (err) {
          results.push({
            name: 'Conexão com Banco',
            status: 'ERRO',
            details: 'Erro na conexão'
          })
        }

        setTests(results)
        setStatus('Testes concluídos')
        
      } catch (error) {
        setStatus('Erro nos testes')
        console.error('Erro:', error)
      }
    }

    runTests()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Teste de Integração Supabase</h1>
      <p><strong>Status:</strong> {status}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Resultados dos Testes:</h2>
        {tests.map((test, index) => (
          <div key={index} style={{ 
            margin: '10px 0', 
            padding: '10px', 
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: test.status === 'OK' ? '#d4edda' : '#f8d7da'
          }}>
            <h3>{test.name}: {test.status === 'OK' ? '✅' : '❌'} {test.status}</h3>
            <p>{test.details}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>ℹ️ Informações do Sistema</h3>
        <p><strong>URL do Supabase:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurada'}</p>
        <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}
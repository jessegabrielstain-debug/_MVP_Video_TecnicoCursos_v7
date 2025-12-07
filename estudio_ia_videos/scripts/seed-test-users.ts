/**
 * Script para criar usuários de teste no Supabase
 * 
 * Uso: npx tsx scripts/seed-test-users.ts
 * 
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('   Necessário: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Cliente admin com Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Usuários de teste a criar
const TEST_USERS = [
  {
    email: 'admin@mvpvideo.test',
    password: 'senha123',
    user_metadata: { full_name: 'Admin Test', role: 'admin' }
  },
  {
    email: 'editor@mvpvideo.test', 
    password: 'senha123',
    user_metadata: { full_name: 'Editor Test', role: 'editor' }
  },
  {
    email: 'viewer@mvpvideo.test',
    password: 'senha123',
    user_metadata: { full_name: 'Viewer Test', role: 'viewer' }
  }
]

async function createTestUsers() {
  console.log('🚀 Criando/Atualizando usuários de teste...\n')

  for (const user of TEST_USERS) {
    try {
      // Verificar se usuário já existe
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === user.email)

      if (existingUser) {
        // Atualizar senha do usuário existente
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: user.password }
        )
        
        if (updateError) {
          console.error(`❌ ${user.email} - Erro ao atualizar: ${updateError.message}`)
        } else {
          console.log(`🔄 ${user.email} - Senha atualizada`)
        }
        continue
      }

      // Criar usuário
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirma email automaticamente
        user_metadata: user.user_metadata
      })

      if (error) {
        console.error(`❌ ${user.email} - Erro: ${error.message}`)
      } else {
        console.log(`✅ ${user.email} - Criado com sucesso (ID: ${data.user?.id})`)
      }
    } catch (err) {
      console.error(`❌ ${user.email} - Erro:`, err)
    }
  }

  console.log('\n📋 Credenciais de teste:')
  console.log('─'.repeat(40))
  TEST_USERS.forEach(user => {
    console.log(`   Email: ${user.email}`)
    console.log(`   Senha: ${user.password}`)
    console.log(`   Role:  ${user.user_metadata.role}`)
    console.log('')
  })
}

// Executar
createTestUsers()
  .then(() => {
    console.log('✅ Script concluído!')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
  })

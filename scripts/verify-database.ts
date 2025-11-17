/**
 * Script de verificação direta do banco de dados
 */

import { createClient } from '@supabase/supabase-js';
import type { Bucket } from '@supabase/storage-js';
import fs from 'fs';
import path from 'path';

// Carregar .env
function loadEnv() {
  let envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    envPath = path.join(process.cwd(), '..', '.env');
  }
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('\n🔍 VERIFICAÇÃO DIRETA DO BANCO DE DADOS\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Não configurada');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('\n📊 Consultando informações do schema...\n');
  
  // Consulta SQL direta para listar tabelas
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
  });

  if (tablesError) {
    console.log('⚠️  RPC exec_sql não disponível. Tentando método alternativo...\n');
    
    // Método alternativo: testar cada tabela individualmente
    const expectedTables = [
      'users', 
      'projects', 
      'slides', 
      'render_jobs', 
      'analytics_events', 
      'nr_courses', 
      'nr_modules'
    ];
    
    console.log('📋 Testando existência de cada tabela:\n');
    
    for (const tableName of expectedTables) {
      try {
        const { error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Existe (${count || 0} registros)`);
        }
      } catch (error: unknown) {
        console.log(`❌ ${tableName}: ${extractErrorMessage(error)}`);
      }
    }
    
    // Verificar buckets
    console.log('\n📦 Verificando Storage Buckets:\n');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      console.log(`✅ Total de buckets: ${buckets?.length || 0}`);
      buckets?.forEach((bucket: Bucket) => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }
    
    // Verificar cursos NR
    console.log('\n📚 Verificando Cursos NR:\n');
    const { data: courses, error: coursesError } = await supabase
      .from('nr_courses')
      .select('*');
    
    if (coursesError) {
      console.log('❌ Erro ao buscar cursos:', coursesError.message);
    } else {
      console.log(`✅ Total de cursos: ${courses?.length || 0}`);
      courses?.forEach((course: NRCourse) => {
        console.log(`   - ${course.code}: ${course.title}`);
      });
    }
    
  } else {
    console.log('✅ Tabelas encontradas:');
    console.log(tables);
  }
  
  console.log('\n✅ Verificação concluída!\n');
}

verify().catch(console.error);

interface NRCourse {
  code: string;
  title: string;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return 'Unknown error';
}

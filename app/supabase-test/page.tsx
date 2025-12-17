'use client';

import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '@/lib/services';
import { logger } from '@/lib/logger';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testando conexão com Supabase...');
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    async function testConnection() {
      try {
        // Teste de conexão básica
        const { data, error } = await supabase.from('users').select('count(*)');
        
        if (error) throw error;
        
        setStatus('success');
        setMessage('Conexão com Supabase estabelecida com sucesso!');
        
        // Verificar usuário atual
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Buscar cursos para teste
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .limit(5);
        
        if (!coursesError && coursesData) {
          setCourses(coursesData);
        }
      } catch (error: unknown) {
        logger.error('Erro ao testar Supabase', error instanceof Error ? error : new Error(String(error)), { component: 'SupabaseTestPage' });
        setStatus('error');
        setMessage(`Falha na conexão: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Integração com Supabase</h1>
      
      <div className={`p-4 mb-6 rounded-lg ${
        status === 'loading' ? 'bg-gray-100' :
        status === 'success' ? 'bg-green-100' :
        'bg-red-100'
      }`}>
        <h2 className="font-semibold text-lg mb-2">Status da Conexão</h2>
        <p>{message}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="font-semibold text-lg mb-2">Usuário Atual</h2>
        {user ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Último Login:</strong> {new Date(user.last_sign_in_at || Date.now()).toLocaleString()}</p>
          </div>
        ) : (
          <p>Nenhum usuário autenticado</p>
        )}
      </div>
      
      <div>
        <h2 className="font-semibold text-lg mb-2">Cursos (Exemplo de Dados)</h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{course.title}</h3>
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhum curso encontrado ou ainda carregando...</p>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="font-semibold text-lg mb-2">Serviços Integrados</h2>
        <ul className="list-disc pl-5">
          <li>Autenticação ✅</li>
          <li>Banco de Dados em Tempo Real ✅</li>
          <li>Armazenamento ✅</li>
          <li>Funções Serverless ✅</li>
          <li>Tratamento de Erros ✅</li>
        </ul>
      </div>
    </div>
  );
}
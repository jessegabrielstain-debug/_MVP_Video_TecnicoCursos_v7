import RenderingTest from '../components/test/RenderingTest';

/**
 * 🧪 Página de Teste de Renderização
 * Valida toda a integração do sistema
 */
export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <RenderingTest />
      </div>
    </div>
  );
}
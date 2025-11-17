import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import DataExportComponent from '@/components/analytics/data-export';
import { createServerSupabaseClient } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Exportação de Dados - Analytics',
  description: 'Exporte dados de analytics em múltiplos formatos',
};

export default async function ExportPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Exportação de Dados</h1>
        <p className="text-muted-foreground">
          Exporte dados de analytics em múltiplos formatos para análise externa ou backup.
        </p>
      </div>

      {/* Componente de Exportação */}
      <DataExportComponent />
    </div>
  );
}
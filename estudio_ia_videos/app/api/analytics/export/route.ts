import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAnalytics } from '@/lib/analytics/middleware';
import { DataExporter, ExportFormat, ExportDataType } from '@/lib/analytics/data-exporter';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';

export async function GET(request: NextRequest) {
  return withAnalytics(async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';
    const dataType = (searchParams.get('type') || 'events') as ExportDataType;
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const organizationId = searchParams.get('organizationId');
    const includeMetadata = searchParams.get('includeMetadata') === 'true';
    const compression = searchParams.get('compression') === 'true';
    const maxRecords = parseInt(searchParams.get('maxRecords') || '10000');

    try {
      // Calcular período
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Configurar opções de exportação
      const exportOptions = {
        format,
        dataType,
        dateRange: {
          start: startDate,
          end: endDate
        },
        filters: {
          ...(organizationId && { organizationId })
        },
        includeMetadata,
        compression,
        maxRecords
      };

      // Usar o DataExporter
      const exporter = new DataExporter();
      const result = await exporter.exportData(exportOptions, session.user.id);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Export failed', details: 'Unknown error' },
          { status: 500 }
        );
      }

      // Determinar content type
      let contentType: string;
      switch (format) {
        case 'csv':
          contentType = 'text/csv';
          break;
        case 'json':
          contentType = 'application/json';
          break;
        case 'xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          contentType = 'text/html'; // Será convertido para PDF no frontend
          break;
        case 'xml':
          contentType = 'application/xml';
          break;
        default:
          contentType = 'application/json';
      }

      return new NextResponse(result.content as BodyInit, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Cache-Control': 'no-cache',
          'X-Export-Metadata': JSON.stringify({
            recordCount: result.recordCount,
            fileSize: result.fileSize,
            processingTime: result.metadata.processingTime
          })
        }
      });

    } catch (error) {
      console.error('[Export API] Error:', error);
      return NextResponse.json(
        { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAnalytics(async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await req.json();
      const {
        format = 'json',
        dataType = 'events',
        dateRange,
        filters = {},
        includeMetadata = false,
        compression = false,
        maxRecords = 10000
      } = body;

      // Validar formato
      const validFormats: ExportFormat[] = ['csv', 'json', 'xlsx', 'pdf', 'xml'];
      if (!validFormats.includes(format)) {
        return NextResponse.json(
          { error: 'Invalid format', validFormats },
          { status: 400 }
        );
      }

      // Validar tipo de dados
      const validDataTypes: ExportDataType[] = ['events', 'performance', 'users', 'projects', 'alerts', 'reports', 'all'];
      if (!validDataTypes.includes(dataType)) {
        return NextResponse.json(
          { error: 'Invalid data type', validDataTypes },
          { status: 400 }
        );
      }

      // Validar range de datas
      if (!dateRange || !dateRange.start || !dateRange.end) {
        return NextResponse.json(
          { error: 'Date range is required' },
          { status: 400 }
        );
      }

      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        );
      }

      // Limitar período máximo (1 ano)
      const maxPeriod = 365 * 24 * 60 * 60 * 1000; // 1 ano em ms
      if (endDate.getTime() - startDate.getTime() > maxPeriod) {
        return NextResponse.json(
          { error: 'Date range cannot exceed 1 year' },
          { status: 400 }
        );
      }

      // Configurar opções de exportação
      const exportOptions = {
        format: format as ExportFormat,
        dataType: dataType as ExportDataType,
        dateRange: {
          start: startDate,
          end: endDate
        },
        filters: {
          ...filters,
          organizationId: filters.organizationId || getOrgId(session.user)
        },
        includeMetadata,
        compression,
        maxRecords: Math.min(maxRecords, 50000) // Limitar a 50k registros
      };

      // Usar o DataExporter
      const exporter = new DataExporter();
      const result = await exporter.exportData(exportOptions, session.user.id);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Export failed', details: 'Unknown error' },
          { status: 500 }
        );
      }

      // Retornar metadados da exportação (sem o conteúdo para POST)
      return NextResponse.json({
        success: true,
        export: {
          filename: result.filename,
          format: result.format,
          dataType: result.dataType,
          recordCount: result.recordCount,
          fileSize: result.fileSize,
          metadata: result.metadata
        },
        downloadUrl: `/api/analytics/export?format=${format}&type=${dataType}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      });

    } catch (error) {
      console.error('[Export API] POST Error:', error);
      return NextResponse.json(
        { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

// Endpoint para listar histórico de exportações
export async function PUT(request: NextRequest) {
  return withAnalytics(async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { searchParams } = new URL(req.url);
      const organizationId = searchParams.get('organizationId') || getOrgId(session.user);

      const exporter = new DataExporter();
      const history = await exporter.getExportHistory(session.user.id, organizationId);

      return NextResponse.json({
        success: true,
        exports: history
      });

    } catch (error) {
      console.error('[Export API] History Error:', error);
      return NextResponse.json(
        { error: 'Failed to get export history', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

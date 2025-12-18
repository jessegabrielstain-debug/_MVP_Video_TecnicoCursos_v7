/**
 * API v2: Plugin Management
 * Gerenciamento de plugins do sistema
 */

import { NextResponse } from 'next/server';
import { pluginSystem } from '@/lib/plugins/plugin-system';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';

// GET /api/v2/plugins - Listar plugins
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    const plugins = enabledOnly ? pluginSystem.listEnabledPlugins() : pluginSystem.listPlugins();

    return NextResponse.json({
      success: true,
      data: plugins.map(p => ({
        id: p.id,
        name: p.name,
        version: p.version,
        author: p.author,
        description: p.description,
        enabled: p.enabled,
        config: p.config
      })),
      count: plugins.length
    });
  } catch (error) {
    logger.error('Error listing plugins', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/plugins'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list plugins'
      },
      { status: 500 }
    );
  }
}

// POST /api/v2/plugins - Registrar novo plugin
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas admins podem registrar plugins
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const pluginData = await req.json();

    const result = await pluginSystem.register(pluginData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Plugin registered successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error registering plugin', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/plugins'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register plugin'
      },
      { status: 500 }
    );
  }
}

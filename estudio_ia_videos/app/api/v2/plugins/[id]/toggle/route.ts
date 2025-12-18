/**
 * API v2: Toggle Plugin
 * Habilita/Desabilita um plugin
 */

import { NextResponse } from 'next/server';
import { pluginSystem } from '@/lib/plugins/plugin-system';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body; // 'enable' or 'disable'

    const plugin = pluginSystem.getPlugin(id);
    if (!plugin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plugin not found'
        },
        { status: 404 }
      );
    }

    let result;
    if (action === 'enable') {
      result = await pluginSystem.enable(id);
    } else if (action === 'disable') {
      result = await pluginSystem.disable(id);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "enable" or "disable"'
        },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pluginId: id,
        enabled: action === 'enable',
        message: `Plugin ${action}d successfully`
      }
    });
  } catch (error) {
    logger.error('Plugin toggle error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/plugins/[id]/toggle'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to toggle plugin'
      },
      { status: 500 }
    );
  }
}

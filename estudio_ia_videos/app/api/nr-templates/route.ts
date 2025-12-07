import { NextRequest, NextResponse } from 'next/server';
import { 
  listNRTemplates, 
  getNRTemplate, 
  createNRTemplate, 
  updateNRTemplate, 
  deleteNRTemplate,
  searchNRTemplates,
  type NRTemplate 
} from '@/lib/services/nr-templates-service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/nr-templates
 * Lista todos os templates ou busca por query
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const nrNumber = searchParams.get('nr');

    // Busca por NR específico
    if (nrNumber) {
      const template = await getNRTemplate(nrNumber);
      if (!template) {
        return NextResponse.json(
          { error: 'Template não encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }

    // Busca por texto
    if (query) {
      const results = await searchNRTemplates(query);
      return NextResponse.json(results);
    }

    // Lista todos
    const templates = await listNRTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return NextResponse.json(
      { error: 'Erro ao listar templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nr-templates
 * Cria um novo template (apenas admins)
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verifica se é admin (role metadata)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const template = await createNRTemplate(body);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { error: 'Erro ao criar template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/nr-templates
 * Atualiza um template existente (apenas admins)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verifica autenticação (mesma lógica do POST)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem atualizar templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    const template = await updateNRTemplate(id, updates);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nr-templates
 * Deleta um template (apenas admins)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verifica autenticação (mesma lógica do POST)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem deletar templates' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    await deleteNRTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar template' },
      { status: 500 }
    );
  }
}


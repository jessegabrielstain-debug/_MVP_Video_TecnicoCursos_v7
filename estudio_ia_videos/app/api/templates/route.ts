/**
 * 📋 Templates API
 * 
 * Gerenciamento de templates de sistema (NRs) e templates customizados de usuários.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/services';

export const dynamic = 'force-dynamic';

// Tipos locais para evitar dependências circulares ou imports quebrados
export type NRCategory = 
  | 'NR-01' | 'NR-05' | 'NR-06' | 'NR-10' | 'NR-12' 
  | 'NR-17' | 'NR-18' | 'NR-20' | 'NR-23' | 'NR-33' | 'NR-35';

export interface TemplateContent {
  slides: unknown[];
  assets: unknown[];
  animations: unknown[];
  interactions: unknown[];
  settings: {
     duration: number;
     resolution: {
       width: number;
       height: number;
     };
     frameRate: number;
     renderSettings: {
       quality: 'low' | 'medium' | 'high' | 'ultra';
       format: 'mp4' | 'webm' | 'gif';
     };
   };
  compliance: {
    nrCategory: NRCategory | string;
    requirements: string[];
    checkpoints: string[];
    certifications: string[];
  };
  performance: {
    renderTime: number;
    fileSize: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface TemplateMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  targetAudience: string[];
  learningObjectives: string[];
  prerequisites: string[];
  language: string;
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    keyboardNavigation: boolean;
    closedCaptions: boolean;
    audioDescription: boolean;
    signLanguage: boolean;
  };
  compliance: {
    nrCategories: (NRCategory | string)[];
    lastAudit: Date;
    auditScore: number;
    certifications: string[];
    status: 'compliant' | 'warning' | 'non-compliant' | 'pending';
    requirements: string[];
  };
  performance: {
    renderTime: number;
    fileSize: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: NRCategory | string;
  thumbnail: string;
  preview: string;
  tags: string[];
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  content: TemplateContent;
  metadata: TemplateMetadata;
}

interface ProjectMetadata {
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 1. Fetch System Templates (NR Templates)
    let systemTemplatesQuery = supabaseAdmin
      .from('nr_templates')
      .select('*');

    if (category) {
      systemTemplatesQuery = systemTemplatesQuery.eq('nr_number', category);
    }
    
    if (search) {
      systemTemplatesQuery = systemTemplatesQuery.ilike('title', `%${search}%`);
    }

    const { data: nrTemplates, error: nrError } = await systemTemplatesQuery;
    if (nrError) throw nrError;

    // Map System Templates to Template Interface
    const mappedSystemTemplates: Template[] = (nrTemplates || []).map(nr => ({
      id: nr.id,
      name: nr.title,
      description: nr.description || '',
      category: nr.nr_number as NRCategory,
      thumbnail: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(nr.title + ' safety training')}&image_size=square`,
      preview: '',
      tags: [nr.nr_number, 'NR', 'Safety'],
      isFavorite: false, 
      isCustom: false,
      createdAt: new Date(nr.created_at),
      updatedAt: new Date(nr.updated_at || Date.now()),
      author: 'Sistema',
      version: '1.0',
      downloads: 0,
      rating: 0,
      content: {
        slides: [],
        assets: [],
        animations: [],
        interactions: [],
        settings: {
          duration: nr.duration_seconds || 600,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          renderSettings: {
            quality: 'medium',
            format: 'mp4'
          }
        },
        compliance: {
          nrCategory: nr.nr_number as NRCategory,
          requirements: [],
          checkpoints: [],
          certifications: []
        },
        performance: {
          renderTime: 0,
          fileSize: 0,
          complexity: 'medium'
        }
      },
      metadata: {
        difficulty: 'intermediate',
        estimatedDuration: nr.duration_seconds ? nr.duration_seconds / 60 : 10,
        targetAudience: [],
        learningObjectives: [],
        prerequisites: [],
        language: 'pt-BR',
        accessibility: {
          screenReader: true,
          highContrast: false,
          keyboardNavigation: true,
          closedCaptions: true,
          audioDescription: false,
          signLanguage: false
        },
        compliance: {
          nrCategories: [nr.nr_number as NRCategory],
          lastAudit: new Date(),
          auditScore: 100,
          certifications: [],
          status: 'compliant',
          requirements: [`Requisito base da ${nr.nr_number}`, 'Conformidade técnica verificada']
        },
        performance: {
          renderTime: 0,
          fileSize: 0,
          complexity: 'medium'
        }
      }
    }));

    // 2. Fetch User Custom Templates (Projects with is_template=true)
    let customTemplates: Template[] = [];
    if (user) {
      let customQuery = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_template', true);

      if (search) {
        customQuery = customQuery.ilike('name', `%${search}%`);
      }

      const { data: userTemplates, error: userError } = await customQuery;
      
      if (!userError && userTemplates) {
        customTemplates = userTemplates.map(p => {
          const metadata = (p.metadata as unknown as ProjectMetadata) || {};
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            category: (metadata.category as string) || 'Custom',
            thumbnail: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p.name)}&image_size=square`,
            preview: '',
            tags: (metadata.tags as string[]) || ['Custom'],
            isFavorite: false,
            isCustom: true,
            createdAt: new Date(p.created_at),
            updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(p.created_at),
            author: user.email || 'User',
            version: p.current_version || '1.0',
            downloads: 0,
            rating: 0,
            content: {
              slides: [],
              assets: [],
              animations: [],
              interactions: [],
              settings: {
                duration: 0,
                resolution: { width: 1920, height: 1080 },
                frameRate: 30,
                renderSettings: {
                  quality: 'medium',
                  format: 'mp4'
                }
              },
              compliance: {
                nrCategory: 'Custom',
                requirements: [],
                checkpoints: [],
                certifications: []
              },
              performance: {
                renderTime: 0,
                fileSize: 0,
                complexity: 'medium'
              }
            },
            metadata: {
              difficulty: (metadata.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
              estimatedDuration: 0,
              targetAudience: [],
              learningObjectives: [],
              prerequisites: [],
              language: 'pt-BR',
              accessibility: {
                screenReader: true,
                highContrast: false,
                keyboardNavigation: true,
                closedCaptions: true,
                audioDescription: false,
                signLanguage: false
              },
              compliance: {
                nrCategories: [],
                lastAudit: new Date(),
                auditScore: 0,
                certifications: [],
                status: 'pending',
                requirements: []
              },
              performance: {
                renderTime: 0,
                fileSize: 0,
                complexity: 'medium'
              }
            }
          };
        });
      }
    }

    // Combine and paginate
    const allTemplates = [...mappedSystemTemplates, ...customTemplates];
    const paginatedTemplates = allTemplates.slice(offset, offset + limit);

    return NextResponse.json(paginatedTemplates);

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateData = await request.json();

    // Create as a Project with is_template=true
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        name: templateData.name,
        description: templateData.description,
        type: 'custom', // or 'template-nr'
        status: 'completed', // Templates are usually ready
        user_id: user.id,
        is_template: true,
        metadata: {
          category: templateData.category,
          tags: templateData.tags,
          difficulty: templateData.metadata?.difficulty
        }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateData = await request.json();
    const { id, ...updates } = templateData;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Verify ownership and is_template status
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id, is_template, metadata')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (existingProject.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!existingProject.is_template) {
      return NextResponse.json({ error: 'Project is not a template' }, { status: 400 });
    }

    const currentMetadata = (existingProject.metadata as unknown as ProjectMetadata) || {};

    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description,
        metadata: {
          ...currentMetadata,
          category: updates.category,
          tags: updates.tags,
          difficulty: updates.metadata?.difficulty
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Verify ownership and is_template status
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id, is_template')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (existingProject.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!existingProject.is_template) {
      return NextResponse.json({ error: 'Project is not a template' }, { status: 400 });
    }

    // Delete the project (soft delete or hard delete? Let's do hard delete for now as per standard project deletion)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateDefaultThumbnail(category: string): string {
  const prompts: Record<string, string> = {
    'NR-12': 'safety training machines equipment industrial workplace',
    'NR-35': 'height work safety training construction harness',
    'NR-33': 'confined spaces safety training industrial tank',
    'NR-10': 'electrical safety training power lines equipment',
    'NR-06': 'personal protective equipment safety training',
    'NR-18': 'construction safety training building site',
    'NR-20': 'flammable combustible safety training industrial',
    'NR-23': 'fire protection safety training emergency',
  };

  const prompt = prompts[category] || 'safety training workplace industrial';
  return `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;
}

function generateDefaultPreview(category: string): string {
  const prompts: Record<string, string> = {
    'NR-12': 'safety training preview machines industrial',
    'NR-35': 'height safety training preview construction',
    'NR-33': 'confined spaces safety preview industrial',
    'NR-10': 'electrical safety training preview power',
    'NR-06': 'ppe safety training preview equipment',
    'NR-18': 'construction safety preview building',
    'NR-20': 'flammable safety training preview industrial',
    'NR-23': 'fire protection preview emergency training',
  };

  const prompt = prompts[category] || 'safety training preview workplace';
  return `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
}

import { NextRequest, NextResponse } from 'next/server';
import { Template } from '@/types/templates';
import { logger } from '@/lib/logger';

// This would be replaced with actual database operations in production
// For now, we'll use a simple in-memory store that matches the main route
let templates: Template[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Increment download count when template is accessed
    template.downloads += 1;

    return NextResponse.json(template);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error fetching template:', err, { component: 'API: templates/[id]' })
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update template
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return NextResponse.json(templates[templateIndex]);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error updating template:', err, { component: 'API: templates/[id]' })
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template can be deleted (only custom templates)
    if (!templates[templateIndex].isCustom) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      );
    }

    // Remove template
    templates.splice(templateIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error deleting template:', err, { component: 'API: templates/[id]' })
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// PATCH for partial updates (like toggling favorite)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Apply partial updates
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return NextResponse.json(templates[templateIndex]);
  } catch (error) {
    logger.error('Error updating template:', error instanceof Error ? error : new Error(String(error)), { component: 'API: templates/[id]' });
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
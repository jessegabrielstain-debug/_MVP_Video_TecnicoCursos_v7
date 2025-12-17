import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface Slide {
  id: string
  title: string
  content: string
  duration: number
  background: string
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  author: string
  version: string
  createdAt: string
  updatedAt: string
  downloads: number
  rating: number
  isCustom: boolean
  isFavorite: boolean
  tags: string[]
  content: {
    slides: Slide[]
    settings: {
      resolution: {
        width: number
        height: number
      }
      frameRate: number
      duration: number
    }
  }
  metadata: {
    usage: {
      downloads: number
      lastUsed: Date
    }
  }
  [key: string]: unknown
}

// Mock database - em produção, usar banco de dados real
let templates: Template[] = [];

// GET - Exportar template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const template = templates.find(t => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado', success: false },
        { status: 404 }
      );
    }

    // Incrementar downloads
    template.downloads += 1;
    template.metadata.usage.downloads += 1;
    template.metadata.usage.lastUsed = new Date();

    let exportData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(template, null, 2);
        contentType = 'application/json';
        filename = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        break;

      case 'xml':
        exportData = convertToXml(template);
        contentType = 'application/xml';
        filename = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
        break;

      case 'zip':
        // Em produção, criar um ZIP real com assets
        exportData = JSON.stringify({
          template,
          assets: [],
          metadata: {
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            format: 'zip',
          },
        }, null, 2);
        contentType = 'application/zip';
        filename = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
        break;

      default:
        return NextResponse.json(
          { error: 'Formato não suportado', success: false },
          { status: 400 }
        );
    }

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Erro ao exportar template', error instanceof Error ? error : new Error(String(error)) instanceof Error ? error instanceof Error ? error : new Error(String(error)) : new Error(String(error instanceof Error ? error : new Error(String(error)))), { component: 'API: templates/export' });
    return NextResponse.json(
      { error: 'Erro interno do servidor', success: false },
      { status: 500 }
    );
  }
}

function convertToXml(template: Template): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<template>
  <id>${template.id}</id>
  <name><![CDATA[${template.name}]]></name>
  <description><![CDATA[${template.description}]]></description>
  <category>${template.category}</category>
  <author><![CDATA[${template.author}]]></author>
  <version>${template.version}</version>
  <createdAt>${template.createdAt}</createdAt>
  <updatedAt>${template.updatedAt}</updatedAt>
  <downloads>${template.downloads}</downloads>
  <rating>${template.rating}</rating>
  <isCustom>${template.isCustom}</isCustom>
  <isFavorite>${template.isFavorite}</isFavorite>
  <tags>
    ${template.tags.map((tag: string) => `<tag><![CDATA[${tag}]]></tag>`).join('\n    ')}
  </tags>
  <content>
    <slides>
      ${template.content.slides.map((slide: Slide) => `
      <slide>
        <id>${slide.id}</id>
        <title><![CDATA[${slide.title}]]></title>
        <content><![CDATA[${slide.content}]]></content>
        <duration>${slide.duration}</duration>
        <background>${slide.background}</background>
      </slide>`).join('')}
    </slides>
    <settings>
      <resolution>
        <width>${template.content.settings.resolution.width}</width>
        <height>${template.content.settings.resolution.height}</height>
      </resolution>
      <frameRate>${template.content.settings.frameRate}</frameRate>
      <duration>${template.content.settings.duration}</duration>
    </settings>
  </content>
</template>`;
}
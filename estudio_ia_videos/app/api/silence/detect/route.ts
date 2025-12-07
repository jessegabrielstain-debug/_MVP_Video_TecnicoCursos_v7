import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SilenceDetector } from '../../../lib/silence-removal/silence-detector';

const UPLOAD_DIR = '/tmp/silence-detection';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;
    const optionsStr = data.get('options') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const options = optionsStr ? JSON.parse(optionsStr) : {};

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Save uploaded file
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Initialize silence detector
    const detector = new SilenceDetector(UPLOAD_DIR);

    // Detect silence
    const result = await detector.detectSilence(filePath, options);

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error detecting silence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Detection failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Silence detection API endpoint',
    methods: ['POST'],
    description: 'Detect silence, breath, and filler word segments in audio/video files'
  });
}
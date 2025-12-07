import React, { Suspense } from 'react';
import TimelineEditorSimple from '@/components/timeline/TimelineEditorSimple';
import { Loader2 } from 'lucide-react';

export default function EditorSimplePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando editor...</span>
      </div>
    }>
      <TimelineEditorSimple />
    </Suspense>
  );
}

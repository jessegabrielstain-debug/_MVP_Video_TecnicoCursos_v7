'use client';

import React, { Suspense } from 'react';
import TimelineEditorSimple from '../components/timeline/TimelineEditorSimple';
import { Loader2, Film } from 'lucide-react';

function TimelineEditorFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white space-y-4">
        <Film className="h-12 w-12 mx-auto animate-pulse" />
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-gray-400">Carregando editor de timeline...</p>
      </div>
    </div>
  );
}

export default function TimelineEditorPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<TimelineEditorFallback />}>
        <TimelineEditorSimple />
      </Suspense>
    </div>
  );
}
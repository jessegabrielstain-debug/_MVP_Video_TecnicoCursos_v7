'use client';

import React from 'react';
import ProfessionalTimelineEditor from '@/components/timeline/ProfessionalTimelineEditor';
import { useParams } from 'next/navigation';

export default function TimelineEditorPage() {
  const params = useParams();
  // id can be used to load project data
  const id = params?.id as string;

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      <ProfessionalTimelineEditor />
    </div>
  );
}

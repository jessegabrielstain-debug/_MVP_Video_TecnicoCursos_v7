'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TimelineRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/editor');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p>Redirecting to Editor Dashboard...</p>
    </div>
  );
}
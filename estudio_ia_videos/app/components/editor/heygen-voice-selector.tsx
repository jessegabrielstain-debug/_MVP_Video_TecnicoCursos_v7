'use client'

import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface HeyGenVoice {
  voice_id: string;
  name: string;
  gender: string;
  language: string;
  preview_audio?: string;
}

interface HeyGenVoiceSelectorProps {
  value?: string;
  onChange: (voiceId: string) => void;
}

export function HeyGenVoiceSelector({ value, onChange }: HeyGenVoiceSelectorProps) {
  const [voices, setVoices] = useState<HeyGenVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/heygen/voices');
        if (!response.ok) throw new Error('Failed to fetch voices');
        const data = await response.json();
        setVoices(data.voices || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load voices');
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading voices...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a voice" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {voices.map((voice) => (
          <SelectItem key={voice.voice_id} value={voice.voice_id}>
            {voice.name} ({voice.gender}, {voice.language})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

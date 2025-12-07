
'use client';

import React, { useEffect, useState } from 'react';
import { X, Play, Plus, ThumbsUp, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NRTemplate } from '@/lib/services/nr-templates-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VideoModalProps {
  template: NRTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ template, isOpen, onClose }: VideoModalProps) {
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      setMuted(true);
    } else {
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!template) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 m-auto h-fit max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-[#141414] shadow-2xl"
          >
            <div className="relative aspect-video w-full bg-black">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-20 rounded-full bg-[#181818] p-2 text-white hover:bg-[#2a2a2a]"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Video Placeholder / Player */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {/* In a real app, this would be a <video> tag or a player component */}
                <div 
                    className="h-full w-full bg-cover bg-center transition-opacity duration-500"
                    style={{ 
                        backgroundImage: `url('/images/placeholders/nr-hero.jpg')`, // Fallback
                        backgroundColor: template.template_config.themeColor || '#1e3a8a'
                    }}
                >
                    {/* Simulated Video Content */}
                    <div className="flex h-full w-full items-center justify-center bg-black/20">
                        <h1 className="text-6xl font-bold text-white/10 select-none">{template.nr_number}</h1>
                    </div>
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
              </div>

              {/* Controls & Info Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  {template.title}
                </h2>
                
                <div className="mb-6 flex items-center gap-4">
                  <Button 
                    className="gap-2 bg-white text-black hover:bg-white/90" 
                    size="lg"
                    onClick={() => console.log('Play clicked')}
                  >
                    <Play className="h-5 w-5 fill-black" />
                    Play
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="gap-2 bg-gray-500/50 text-white hover:bg-gray-500/70" 
                    size="lg"
                  >
                    <Plus className="h-5 w-5" />
                    My List
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full border-2 border-gray-500/50 text-white hover:bg-gray-500/30"
                  >
                    <ThumbsUp className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex-1" />
                  
                  <button 
                    onClick={() => setMuted(!muted)}
                    className="rounded-full border border-white/30 p-2 text-white/70 hover:border-white hover:text-white"
                  >
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid gap-8 bg-[#141414] p-8 text-white md:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-500">
                  <span>98% Match</span>
                  <span className="text-gray-400">{new Date(template.updated_at).getFullYear()}</span>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">HD</Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">5.1</Badge>
                </div>
                
                <p className="text-lg leading-relaxed text-gray-300">
                  {template.description || `Experience the comprehensive guide to ${template.title}. This training module covers all essential safety protocols and compliance requirements defined in ${template.nr_number}.`}
                </p>
              </div>

              <div className="space-y-4 text-sm text-gray-400">
                <div>
                  <span className="text-gray-500">Duration:</span>{' '}
                  <span className="text-white">{Math.floor(template.duration_seconds / 60)}m</span>
                </div>
                <div>
                  <span className="text-gray-500">Slides:</span>{' '}
                  <span className="text-white">{template.slide_count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Genres:</span>{' '}
                  <span className="text-white">Safety, Compliance, Technical</span>
                </div>
                <div>
                  <span className="text-gray-500">This show is:</span>{' '}
                  <span className="text-white">Educational, Mandatory</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

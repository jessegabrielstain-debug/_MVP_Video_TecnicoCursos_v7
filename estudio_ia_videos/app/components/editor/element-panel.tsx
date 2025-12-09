'use client';

import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  Image, 
  Shapes, 
  User, 
  Video, 
  Music, 
  Square, 
  Circle, 
  Triangle, 
  Star,
  Heart,
  Hexagon,
  Search,
  Download,
  Upload,
  Palette,
  Sparkles,
  Zap,
  Crown,
  Shield,
  Target,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Camera,
  Mic,
  Speaker,
  Headphones
} from 'lucide-react';

interface ElementPanelProps {
  onAddElement: (type: string, properties?: any) => void;
}

export function ElementPanel({ onAddElement }: ElementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const textElements = [
    { id: 'heading', name: 'Heading', icon: Type, properties: { fontSize: 32, fontWeight: 'bold' } },
    { id: 'paragraph', name: 'Paragraph', icon: Type, properties: { fontSize: 16, lineHeight: 1.5 } },
    { id: 'caption', name: 'Caption', icon: Type, properties: { fontSize: 12, color: '#6b7280' } },
    { id: 'quote', name: 'Quote', icon: Type, properties: { fontSize: 18, fontStyle: 'italic' } },
  ];

  const mediaElements = [
    { id: 'image', name: 'Image', icon: Image, properties: {} },
    { id: 'video', name: 'Video', icon: Video, properties: {} },
    { id: 'audio', name: 'Audio', icon: Music, properties: {} },
    { id: 'camera', name: 'Camera', icon: Camera, properties: {} },
  ];

  const shapeElements = [
    { id: 'rectangle', name: 'Rectangle', icon: Square, properties: { shape: 'rectangle' } },
    { id: 'circle', name: 'Circle', icon: Circle, properties: { shape: 'circle' } },
    { id: 'triangle', name: 'Triangle', icon: Triangle, properties: { shape: 'triangle' } },
    { id: 'star', name: 'Star', icon: Star, properties: { shape: 'star' } },
    { id: 'heart', name: 'Heart', icon: Heart, properties: { shape: 'heart' } },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon, properties: { shape: 'hexagon' } },
  ];

  const avatarElements = [
    { id: 'male-casual', name: 'Male Casual', icon: User, properties: { gender: 'male', style: 'casual' } },
    { id: 'female-casual', name: 'Female Casual', icon: User, properties: { gender: 'female', style: 'casual' } },
    { id: 'male-business', name: 'Male Business', icon: User, properties: { gender: 'male', style: 'business' } },
    { id: 'female-business', name: 'Female Business', icon: User, properties: { gender: 'female', style: 'business' } },
    { id: 'instructor', name: 'Instructor', icon: User, properties: { role: 'instructor' } },
    { id: 'worker', name: 'Worker', icon: User, properties: { role: 'worker' } },
  ];

  const iconElements = [
    { id: 'sparkles', name: 'Sparkles', icon: Sparkles, properties: { iconType: 'sparkles' } },
    { id: 'zap', name: 'Lightning', icon: Zap, properties: { iconType: 'zap' } },
    { id: 'crown', name: 'Crown', icon: Crown, properties: { iconType: 'crown' } },
    { id: 'shield', name: 'Shield', icon: Shield, properties: { iconType: 'shield' } },
    { id: 'target', name: 'Target', icon: Target, properties: { iconType: 'target' } },
    { id: 'flame', name: 'Flame', icon: Flame, properties: { iconType: 'flame' } },
    { id: 'snowflake', name: 'Snowflake', icon: Snowflake, properties: { iconType: 'snowflake' } },
    { id: 'sun', name: 'Sun', icon: Sun, properties: { iconType: 'sun' } },
    { id: 'moon', name: 'Moon', icon: Moon, properties: { iconType: 'moon' } },
    { id: 'cloud', name: 'Cloud', icon: Cloud, properties: { iconType: 'cloud' } },
    { id: 'umbrella', name: 'Umbrella', icon: Umbrella, properties: { iconType: 'umbrella' } },
    { id: 'mic', name: 'Microphone', icon: Mic, properties: { iconType: 'mic' } },
    { id: 'speaker', name: 'Speaker', icon: Speaker, properties: { iconType: 'speaker' } },
    { id: 'headphones', name: 'Headphones', icon: Headphones, properties: { iconType: 'headphones' } },
  ];

  const filterElements = (elements: any[], category: string) => {
    let filtered = elements;
    
    if (category !== 'all') {
      // Category filtering is handled by tabs
    }
    
    if (searchTerm) {
      filtered = filtered.filter(element =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const renderElementGrid = (elements: any[], type: string) => (
    <div className="grid grid-cols-2 gap-2">
      {filterElements(elements, selectedCategory).map((element) => {
        const IconComponent = element.icon;
        return (
          <Card
            key={element.id}
            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onAddElement(type, element.properties)}
          >
            <div className="flex flex-col items-center space-y-2">
              <IconComponent className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-center">{element.name}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Elements</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Assets
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mx-4 mt-4">
            <TabsTrigger value="text" className="text-xs">
              <Type className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="media" className="text-xs">
              <Image className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="shapes" className="text-xs">
              <Shapes className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="avatars" className="text-xs">
              <User className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="icons" className="text-xs">
              <Sparkles className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="text" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Type className="w-4 h-4 mr-2" />
                  Text Elements
                </h3>
                {renderElementGrid(textElements, 'text')}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Image className="w-4 h-4 mr-2" />
                  Media Elements
                </h3>
                {renderElementGrid(mediaElements, 'image')}
              </div>
            </TabsContent>

            <TabsContent value="shapes" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Shapes className="w-4 h-4 mr-2" />
                  Shape Elements
                </h3>
                {renderElementGrid(shapeElements, 'shape')}
              </div>
            </TabsContent>

            <TabsContent value="avatars" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Avatar Elements
                </h3>
                {renderElementGrid(avatarElements, 'avatar')}
              </div>
            </TabsContent>

            <TabsContent value="icons" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Icon Elements
                </h3>
                {renderElementGrid(iconElements, 'icon')}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>

      {/* Color Palette */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-3 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Quick Colors
        </h3>
        <div className="grid grid-cols-8 gap-2">
          {[
            '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
            '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#dc2626', '#ea580c',
            '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#374151'
          ].map((color) => (
            <div
              key={color}
              className="w-6 h-6 rounded cursor-pointer border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                // Handle color selection
                logger.debug('Selected color', { component: 'ElementPanel', color });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
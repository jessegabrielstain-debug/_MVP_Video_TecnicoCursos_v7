/**
 * 👤 Appearance Customization - Sistema de Customização de Aparência
 * Customização completa de cabelo, pele, roupas e acessórios
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Palette,
  Shirt,
  Crown,
  Eye,
  Smile,
  Heart,
  Star,
  Shuffle,
  Download,
  Upload,
  RotateCcw,
  Save,
  Share2,
  Camera,
  Zap,
  Sparkles,
  Brush,
  Scissors,
  Glasses
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AppearanceSettings {
  // Características Faciais
  face: {
    shape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
    skinTone: string;
    skinTexture: 'smooth' | 'normal' | 'textured';
    age: number;
    gender: 'masculine' | 'feminine' | 'neutral';
  };
  
  // Cabelo
  hair: {
    style: string;
    color: string;
    length: 'short' | 'medium' | 'long';
    texture: 'straight' | 'wavy' | 'curly' | 'coily';
    volume: number;
    shine: number;
  };
  
  // Olhos
  eyes: {
    shape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned';
    color: string;
    size: number;
    eyebrows: {
      thickness: number;
      arch: number;
      color: string;
    };
    eyelashes: {
      length: number;
      curl: number;
      color: string;
    };
  };
  
  // Nariz e Boca
  features: {
    nose: {
      size: number;
      width: number;
      bridge: number;
    };
    mouth: {
      size: number;
      shape: 'full' | 'thin' | 'bow' | 'wide';
      color: string;
    };
    cheeks: {
      prominence: number;
      blush: number;
      blushColor: string;
    };
  };
  
  // Roupas
  clothing: {
    top: string;
    bottom: string;
    shoes: string;
    accessories: string[];
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    style: 'casual' | 'formal' | 'sporty' | 'elegant' | 'creative';
  };
  
  // Acessórios
  accessories: {
    glasses: string | null;
    jewelry: string[];
    hat: string | null;
    makeup: {
      foundation: number;
      eyeshadow: string;
      lipstick: string;
      mascara: number;
      blush: number;
    };
  };
}

interface AppearanceCustomizationProps {
  avatarId: string;
  onAppearanceChange?: (settings: AppearanceSettings) => void;
  initialSettings?: Partial<AppearanceSettings>;
}

export default function AppearanceCustomization({ 
  avatarId, 
  onAppearanceChange,
  initialSettings 
}: AppearanceCustomizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Estado das configurações de aparência
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    face: {
      shape: 'oval',
      skinTone: '#fdbcb4',
      skinTexture: 'normal',
      age: 25,
      gender: 'neutral'
    },
    hair: {
      style: 'medium_wavy',
      color: '#8b4513',
      length: 'medium',
      texture: 'wavy',
      volume: 70,
      shine: 50
    },
    eyes: {
      shape: 'almond',
      color: '#4a4a4a',
      size: 50,
      eyebrows: {
        thickness: 60,
        arch: 50,
        color: '#8b4513'
      },
      eyelashes: {
        length: 70,
        curl: 60,
        color: '#2c2c2c'
      }
    },
    features: {
      nose: {
        size: 50,
        width: 50,
        bridge: 50
      },
      mouth: {
        size: 50,
        shape: 'full',
        color: '#d4756b'
      },
      cheeks: {
        prominence: 40,
        blush: 30,
        blushColor: '#ffb3ba'
      }
    },
    clothing: {
      top: 'casual_shirt',
      bottom: 'jeans',
      shoes: 'sneakers',
      accessories: [],
      colors: {
        primary: '#4a90e2',
        secondary: '#2c3e50',
        accent: '#e74c3c'
      },
      style: 'casual'
    },
    accessories: {
      glasses: null,
      jewelry: [],
      hat: null,
      makeup: {
        foundation: 20,
        eyeshadow: '#f4f4f4',
        lipstick: '#d4756b',
        mascara: 50,
        blush: 30
      }
    },
    ...initialSettings
  });

  // Presets de aparência
  const appearancePresets = {
    'Profissional Masculino': {
      face: { shape: 'square' as const, gender: 'masculine' as const, age: 30 },
      hair: { style: 'short_professional', color: '#2c2c2c', length: 'short' as const, texture: 'straight' as const },
      clothing: { 
        top: 'suit_jacket', 
        bottom: 'dress_pants', 
        shoes: 'dress_shoes',
        style: 'formal' as const,
        colors: { primary: '#2c3e50', secondary: '#34495e', accent: '#3498db' }
      },
      accessories: { glasses: 'professional', makeup: { foundation: 10, mascara: 20, blush: 10 } }
    },
    'Profissional Feminino': {
      face: { shape: 'oval' as const, gender: 'feminine' as const, age: 28 },
      hair: { style: 'long_straight', color: '#8b4513', length: 'long' as const, texture: 'straight' as const },
      clothing: { 
        top: 'blazer', 
        bottom: 'pencil_skirt', 
        shoes: 'heels',
        style: 'formal' as const,
        colors: { primary: '#2c3e50', secondary: '#e74c3c', accent: '#f39c12' }
      },
      accessories: { jewelry: ['earrings', 'necklace'], makeup: { foundation: 40, mascara: 70, blush: 40 } }
    },
    'Casual Jovem': {
      face: { shape: 'round' as const, gender: 'neutral' as const, age: 22 },
      hair: { style: 'medium_messy', color: '#d4a574', length: 'medium' as const, texture: 'wavy' as const },
      clothing: { 
        top: 't_shirt', 
        bottom: 'jeans', 
        shoes: 'sneakers',
        style: 'casual' as const,
        colors: { primary: '#e74c3c', secondary: '#3498db', accent: '#f39c12' }
      },
      accessories: { hat: 'cap', jewelry: ['bracelet'], makeup: { foundation: 20, mascara: 40, blush: 20 } }
    },
    'Criativo Artístico': {
      face: { shape: 'heart' as const, gender: 'neutral' as const, age: 26 },
      hair: { style: 'colorful_long', color: '#9b59b6', length: 'long' as const, texture: 'curly' as const },
      clothing: { 
        top: 'artistic_shirt', 
        bottom: 'creative_pants', 
        shoes: 'boots',
        style: 'creative' as const,
        colors: { primary: '#9b59b6', secondary: '#e67e22', accent: '#1abc9c' }
      },
      accessories: { glasses: 'artistic', jewelry: ['rings', 'necklace'], makeup: { foundation: 30, mascara: 60, blush: 50 } }
    }
  };

  // Opções de customização
  const hairStyles = [
    { id: 'short_professional', name: 'Profissional Curto', category: 'short' },
    { id: 'short_casual', name: 'Casual Curto', category: 'short' },
    { id: 'medium_wavy', name: 'Médio Ondulado', category: 'medium' },
    { id: 'medium_straight', name: 'Médio Liso', category: 'medium' },
    { id: 'long_straight', name: 'Longo Liso', category: 'long' },
    { id: 'long_curly', name: 'Longo Cacheado', category: 'long' },
    { id: 'colorful_long', name: 'Longo Colorido', category: 'long' },
    { id: 'medium_messy', name: 'Médio Bagunçado', category: 'medium' }
  ];

  const clothingItems = {
    tops: [
      { id: 'casual_shirt', name: 'Camisa Casual', style: 'casual' },
      { id: 't_shirt', name: 'Camiseta', style: 'casual' },
      { id: 'suit_jacket', name: 'Terno', style: 'formal' },
      { id: 'blazer', name: 'Blazer', style: 'formal' },
      { id: 'hoodie', name: 'Moletom', style: 'sporty' },
      { id: 'artistic_shirt', name: 'Camisa Artística', style: 'creative' }
    ],
    bottoms: [
      { id: 'jeans', name: 'Jeans', style: 'casual' },
      { id: 'dress_pants', name: 'Calça Social', style: 'formal' },
      { id: 'pencil_skirt', name: 'Saia Lápis', style: 'formal' },
      { id: 'shorts', name: 'Shorts', style: 'sporty' },
      { id: 'creative_pants', name: 'Calça Criativa', style: 'creative' }
    ],
    shoes: [
      { id: 'sneakers', name: 'Tênis', style: 'casual' },
      { id: 'dress_shoes', name: 'Sapato Social', style: 'formal' },
      { id: 'heels', name: 'Salto Alto', style: 'formal' },
      { id: 'boots', name: 'Botas', style: 'creative' },
      { id: 'sandals', name: 'Sandálias', style: 'casual' }
    ]
  };

  const accessoryOptions = {
    glasses: [
      { id: 'professional', name: 'Óculos Profissional' },
      { id: 'artistic', name: 'Óculos Artístico' },
      { id: 'sunglasses', name: 'Óculos de Sol' },
      { id: 'reading', name: 'Óculos de Leitura' }
    ],
    jewelry: [
      { id: 'earrings', name: 'Brincos' },
      { id: 'necklace', name: 'Colar' },
      { id: 'bracelet', name: 'Pulseira' },
      { id: 'rings', name: 'Anéis' },
      { id: 'watch', name: 'Relógio' }
    ],
    hats: [
      { id: 'cap', name: 'Boné' },
      { id: 'hat', name: 'Chapéu' },
      { id: 'beanie', name: 'Gorro' },
      { id: 'beret', name: 'Boina' }
    ]
  };

  // Cores predefinidas
  const skinTones = [
    '#fdbcb4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#654321', '#3c2415'
  ];

  const hairColors = [
    '#2c2c2c', '#8b4513', '#d4a574', '#ffd700', '#ff6347', '#9b59b6', '#3498db', '#e74c3c'
  ];

  const eyeColors = [
    '#4a4a4a', '#8b4513', '#228b22', '#4169e1', '#9370db', '#20b2aa', '#32cd32'
  ];

  // Atualizar configurações
  const updateAppearance = (category: keyof AppearanceSettings, updates: any) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates
      }
    }));
  };

  // Aplicar preset
  const applyPreset = (presetName: string) => {
    const preset = appearancePresets[presetName as keyof typeof appearancePresets];
    if (preset) {
      setAppearanceSettings(prev => ({
        ...prev,
        face: { ...prev.face, ...preset.face },
        hair: { ...prev.hair, ...preset.hair },
        clothing: { 
          ...prev.clothing, 
          ...preset.clothing,
          colors: { ...prev.clothing.colors, ...preset.clothing.colors }
        },
        accessories: { 
          ...prev.accessories, 
          ...preset.accessories,
          makeup: { ...prev.accessories.makeup, ...preset.accessories.makeup }
        }
      }));
      toast.success(`Preset "${presetName}" aplicado!`);
    }
  };

  // Randomizar aparência
  const randomizeAppearance = () => {
    const randomSkinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
    const randomHairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
    const randomEyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
    const randomHairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    
    setAppearanceSettings(prev => ({
      ...prev,
      face: {
        ...prev.face,
        skinTone: randomSkinTone,
        age: Math.floor(Math.random() * 40) + 18
      },
      hair: {
        ...prev.hair,
        style: randomHairStyle.id,
        color: randomHairColor,
        volume: Math.floor(Math.random() * 100),
        shine: Math.floor(Math.random() * 100)
      },
      eyes: {
        ...prev.eyes,
        color: randomEyeColor,
        size: Math.floor(Math.random() * 100)
      }
    }));
    
    toast.success('Aparência randomizada!');
  };

  // Renderizar preview
  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Renderizar corpo (roupas)
    ctx.fillStyle = appearanceSettings.clothing.colors.primary;
    ctx.fillRect(centerX - 60, centerY + 40, 120, 160);

    // Renderizar cabeça
    ctx.fillStyle = appearanceSettings.face.skinTone;
    ctx.beginPath();
    
    // Forma do rosto baseada na configuração
    const faceWidth = 80;
    const faceHeight = appearanceSettings.face.shape === 'round' ? 90 : 
                     appearanceSettings.face.shape === 'square' ? 85 :
                     appearanceSettings.face.shape === 'heart' ? 75 : 100;
    
    ctx.ellipse(centerX, centerY - 20, faceWidth, faceHeight, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Renderizar cabelo
    ctx.fillStyle = appearanceSettings.hair.color;
    ctx.beginPath();
    
    const hairVolume = appearanceSettings.hair.volume / 100;
    const hairWidth = faceWidth * (0.9 + hairVolume * 0.3);
    const hairHeight = appearanceSettings.hair.length === 'short' ? 40 :
                      appearanceSettings.hair.length === 'medium' ? 60 : 80;
    
    ctx.ellipse(centerX, centerY - 60, hairWidth, hairHeight, 0, 0, Math.PI);
    ctx.fill();

    // Renderizar olhos
    const eyeSize = 8 + (appearanceSettings.eyes.size / 100) * 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(centerX - 25, centerY - 40, eyeSize, eyeSize * 0.7, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 25, centerY - 40, eyeSize, eyeSize * 0.7, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Pupilas
    ctx.fillStyle = appearanceSettings.eyes.color;
    ctx.beginPath();
    ctx.ellipse(centerX - 25, centerY - 40, eyeSize * 0.6, eyeSize * 0.6, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 25, centerY - 40, eyeSize * 0.6, eyeSize * 0.6, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Sobrancelhas
    ctx.strokeStyle = appearanceSettings.eyes.eyebrows.color;
    ctx.lineWidth = 2 + (appearanceSettings.eyes.eyebrows.thickness / 100) * 3;
    ctx.lineCap = 'round';
    
    const eyebrowArch = appearanceSettings.eyes.eyebrows.arch / 100 * 10;
    ctx.beginPath();
    ctx.moveTo(centerX - 35, centerY - 55 - eyebrowArch);
    ctx.lineTo(centerX - 15, centerY - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 15, centerY - 60);
    ctx.lineTo(centerX + 35, centerY - 55 - eyebrowArch);
    ctx.stroke();

    // Nariz
    const noseSize = appearanceSettings.features.nose.size / 100;
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1 + noseSize;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX - 2 - noseSize, centerY - 10);
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX + 2 + noseSize, centerY - 10);
    ctx.stroke();

    // Boca
    const mouthSize = 10 + (appearanceSettings.features.mouth.size / 100) * 10;
    ctx.fillStyle = appearanceSettings.features.mouth.color;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 15, mouthSize, mouthSize * 0.6, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Bochechas (blush)
    if (appearanceSettings.features.cheeks.blush > 0) {
      const blushOpacity = appearanceSettings.features.cheeks.blush / 100 * 0.6;
      ctx.fillStyle = appearanceSettings.features.cheeks.blushColor.replace(')', `, ${blushOpacity})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.ellipse(centerX - 50, centerY - 10, 15, 10, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 50, centerY - 10, 15, 10, 0, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Óculos se selecionados
    if (appearanceSettings.accessories.glasses) {
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX - 25, centerY - 40, 20, 15, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(centerX + 25, centerY - 40, 20, 15, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Ponte dos óculos
      ctx.beginPath();
      ctx.moveTo(centerX - 5, centerY - 40);
      ctx.lineTo(centerX + 5, centerY - 40);
      ctx.stroke();
    }

    // Chapéu se selecionado
    if (appearanceSettings.accessories.hat) {
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 80, hairWidth + 10, 20, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Salvar configurações
  const saveAppearance = () => {
    const dataStr = JSON.stringify(appearanceSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `avatar-appearance-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Configurações salvas!');
  };

  // Carregar configurações
  const loadAppearance = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        setAppearanceSettings(settings);
        toast.success('Configurações carregadas!');
      } catch (error) {
        toast.error('Erro ao carregar configurações');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    renderPreview();
    if (onAppearanceChange) {
      onAppearanceChange(appearanceSettings);
    }
  }, [appearanceSettings, onAppearanceChange]);

  return (
    <div className="space-y-6">
      {/* Preview */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Preview do Avatar
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={randomizeAppearance}>
                <Shuffle className="w-4 h-4 mr-2" />
                Randomizar
              </Button>
              <Button variant="outline" size="sm" onClick={saveAppearance}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={loadAppearance}
                  className="hidden"
                />
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={300}
              height={400}
              className="border-2 border-gray-200 rounded-lg shadow-lg bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Presets de Aparência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(appearancePresets).map((presetName) => (
              <Button
                key={presetName}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presetName)}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs text-center">{presetName}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customização Detalhada */}
      <Tabs defaultValue="face" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="face">Rosto</TabsTrigger>
          <TabsTrigger value="hair">Cabelo</TabsTrigger>
          <TabsTrigger value="eyes">Olhos</TabsTrigger>
          <TabsTrigger value="clothing">Roupas</TabsTrigger>
          <TabsTrigger value="accessories">Acessórios</TabsTrigger>
        </TabsList>

        <TabsContent value="face" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="w-5 h-5" />
                Características Faciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Formato do Rosto</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['oval', 'round', 'square', 'heart', 'diamond'].map((shape) => (
                      <Button
                        key={shape}
                        variant={appearanceSettings.face.shape === shape ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateAppearance('face', { shape })}
                      >
                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Gênero</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['masculine', 'feminine', 'neutral'].map((gender) => (
                      <Button
                        key={gender}
                        variant={appearanceSettings.face.gender === gender ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateAppearance('face', { gender })}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Tom de Pele</Label>
                <div className="flex gap-2 mt-2">
                  {skinTones.map((tone) => (
                    <button
                      key={tone}
                      className={`w-8 h-8 rounded-full border-2 ${
                        appearanceSettings.face.skinTone === tone ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: tone }}
                      onClick={() => updateAppearance('face', { skinTone: tone })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Idade: {appearanceSettings.face.age} anos</Label>
                <Slider
                  value={[appearanceSettings.face.age]}
                  onValueChange={([age]) => updateAppearance('face', { age })}
                  min={18}
                  max={70}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Textura da Pele</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['smooth', 'normal', 'textured'].map((texture) => (
                    <Button
                      key={texture}
                      variant={appearanceSettings.face.skinTexture === texture ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAppearance('face', { skinTexture: texture })}
                    >
                      {texture.charAt(0).toUpperCase() + texture.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hair" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Cabelo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Estilo do Cabelo</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {hairStyles.map((style) => (
                    <Button
                      key={style.id}
                      variant={appearanceSettings.hair.style === style.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAppearance('hair', { style: style.id })}
                    >
                      {style.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Cor do Cabelo</Label>
                <div className="flex gap-2 mt-2">
                  {hairColors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        appearanceSettings.hair.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateAppearance('hair', { color })}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Volume: {appearanceSettings.hair.volume}%</Label>
                  <Slider
                    value={[appearanceSettings.hair.volume]}
                    onValueChange={([volume]) => updateAppearance('hair', { volume })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Brilho: {appearanceSettings.hair.shine}%</Label>
                  <Slider
                    value={[appearanceSettings.hair.shine]}
                    onValueChange={([shine]) => updateAppearance('hair', { shine })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Textura</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {['straight', 'wavy', 'curly', 'coily'].map((texture) => (
                    <Button
                      key={texture}
                      variant={appearanceSettings.hair.texture === texture ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAppearance('hair', { texture })}
                    >
                      {texture.charAt(0).toUpperCase() + texture.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eyes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Olhos e Expressão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Formato dos Olhos</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned'].map((shape) => (
                    <Button
                      key={shape}
                      variant={appearanceSettings.eyes.shape === shape ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAppearance('eyes', { shape })}
                    >
                      {shape.charAt(0).toUpperCase() + shape.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Cor dos Olhos</Label>
                <div className="flex gap-2 mt-2">
                  {eyeColors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        appearanceSettings.eyes.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateAppearance('eyes', { color })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Tamanho dos Olhos: {appearanceSettings.eyes.size}%</Label>
                <Slider
                  value={[appearanceSettings.eyes.size]}
                  onValueChange={([size]) => updateAppearance('eyes', { size })}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Espessura das Sobrancelhas: {appearanceSettings.eyes.eyebrows.thickness}%</Label>
                  <Slider
                    value={[appearanceSettings.eyes.eyebrows.thickness]}
                    onValueChange={([thickness]) => updateAppearance('eyes', { 
                      eyebrows: { ...appearanceSettings.eyes.eyebrows, thickness }
                    })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Curvatura das Sobrancelhas: {appearanceSettings.eyes.eyebrows.arch}%</Label>
                  <Slider
                    value={[appearanceSettings.eyes.eyebrows.arch]}
                    onValueChange={([arch]) => updateAppearance('eyes', { 
                      eyebrows: { ...appearanceSettings.eyes.eyebrows, arch }
                    })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Comprimento dos Cílios: {appearanceSettings.eyes.eyelashes.length}%</Label>
                  <Slider
                    value={[appearanceSettings.eyes.eyelashes.length]}
                    onValueChange={([length]) => updateAppearance('eyes', { 
                      eyelashes: { ...appearanceSettings.eyes.eyelashes, length }
                    })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Curvatura dos Cílios: {appearanceSettings.eyes.eyelashes.curl}%</Label>
                  <Slider
                    value={[appearanceSettings.eyes.eyelashes.curl]}
                    onValueChange={([curl]) => updateAppearance('eyes', { 
                      eyelashes: { ...appearanceSettings.eyes.eyelashes, curl }
                    })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clothing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="w-5 h-5" />
                Roupas e Estilo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Estilo</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {['casual', 'formal', 'sporty', 'elegant', 'creative'].map((style) => (
                    <Button
                      key={style}
                      variant={appearanceSettings.clothing.style === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAppearance('clothing', { style })}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Parte Superior</Label>
                  <div className="space-y-2 mt-2">
                    {clothingItems.tops.map((item) => (
                      <Button
                        key={item.id}
                        variant={appearanceSettings.clothing.top === item.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => updateAppearance('clothing', { top: item.id })}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Parte Inferior</Label>
                  <div className="space-y-2 mt-2">
                    {clothingItems.bottoms.map((item) => (
                      <Button
                        key={item.id}
                        variant={appearanceSettings.clothing.bottom === item.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => updateAppearance('clothing', { bottom: item.id })}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Calçados</Label>
                  <div className="space-y-2 mt-2">
                    {clothingItems.shoes.map((item) => (
                      <Button
                        key={item.id}
                        variant={appearanceSettings.clothing.shoes === item.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => updateAppearance('clothing', { shoes: item.id })}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Cores das Roupas</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Cor Primária</Label>
                    <Input
                      type="color"
                      value={appearanceSettings.clothing.colors.primary}
                      onChange={(e) => updateAppearance('clothing', {
                        colors: { ...appearanceSettings.clothing.colors, primary: e.target.value }
                      })}
                      className="h-10 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cor Secundária</Label>
                    <Input
                      type="color"
                      value={appearanceSettings.clothing.colors.secondary}
                      onChange={(e) => updateAppearance('clothing', {
                        colors: { ...appearanceSettings.clothing.colors, secondary: e.target.value }
                      })}
                      className="h-10 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Cor de Destaque</Label>
                    <Input
                      type="color"
                      value={appearanceSettings.clothing.colors.accent}
                      onChange={(e) => updateAppearance('clothing', {
                        colors: { ...appearanceSettings.clothing.colors, accent: e.target.value }
                      })}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Acessórios e Maquiagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Óculos</Label>
                  <div className="space-y-2 mt-2">
                    <Button
                      variant={!appearanceSettings.accessories.glasses ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => updateAppearance('accessories', { glasses: null })}
                    >
                      Nenhum
                    </Button>
                    {accessoryOptions.glasses.map((item) => (
                      <Button
                        key={item.id}
                        variant={appearanceSettings.accessories.glasses === item.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => updateAppearance('accessories', { glasses: item.id })}
                      >
                        <Glasses className="w-4 h-4 mr-2" />
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Chapéus</Label>
                  <div className="space-y-2 mt-2">
                    <Button
                      variant={!appearanceSettings.accessories.hat ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => updateAppearance('accessories', { hat: null })}
                    >
                      Nenhum
                    </Button>
                    {accessoryOptions.hats.map((item) => (
                      <Button
                        key={item.id}
                        variant={appearanceSettings.accessories.hat === item.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => updateAppearance('accessories', { hat: item.id })}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Joias</Label>
                  <div className="space-y-2 mt-2">
                    {accessoryOptions.jewelry.map((item) => (
                      <label key={item.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={appearanceSettings.accessories.jewelry.includes(item.id)}
                          onChange={(e) => {
                            const jewelry = e.target.checked
                              ? [...appearanceSettings.accessories.jewelry, item.id]
                              : appearanceSettings.accessories.jewelry.filter(j => j !== item.id);
                            updateAppearance('accessories', { jewelry });
                          }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Maquiagem</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Base: {appearanceSettings.accessories.makeup.foundation}%</Label>
                    <Slider
                      value={[appearanceSettings.accessories.makeup.foundation]}
                      onValueChange={([foundation]) => updateAppearance('accessories', {
                        makeup: { ...appearanceSettings.accessories.makeup, foundation }
                      })}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Rímel: {appearanceSettings.accessories.makeup.mascara}%</Label>
                    <Slider
                      value={[appearanceSettings.accessories.makeup.mascara]}
                      onValueChange={([mascara]) => updateAppearance('accessories', {
                        makeup: { ...appearanceSettings.accessories.makeup, mascara }
                      })}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Blush: {appearanceSettings.accessories.makeup.blush}%</Label>
                    <Slider
                      value={[appearanceSettings.accessories.makeup.blush]}
                      onValueChange={([blush]) => updateAppearance('accessories', {
                        makeup: { ...appearanceSettings.accessories.makeup, blush }
                      })}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Cor do Batom</Label>
                    <Input
                      type="color"
                      value={appearanceSettings.accessories.makeup.lipstick}
                      onChange={(e) => updateAppearance('accessories', {
                        makeup: { ...appearanceSettings.accessories.makeup, lipstick: e.target.value }
                      })}
                      className="h-8 w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
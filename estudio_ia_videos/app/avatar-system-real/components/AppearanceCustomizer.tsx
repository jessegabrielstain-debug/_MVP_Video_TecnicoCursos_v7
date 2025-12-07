// TODO: Fixar tipos AppearanceSettings após estabilizar interface
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Palette, 
  Shirt, 
  Eye, 
  Scissors,
  Crown,
  Glasses,
  Watch,
  Gem,
  Shuffle,
  Download,
  Upload,
  Save,
  RotateCcw,
  Zap,
  Camera,
  Settings
} from 'lucide-react';

interface AppearanceSettings {
  // Características físicas
  gender: 'male' | 'female' | 'non-binary';
  age: number;
  height: number;
  bodyType: 'slim' | 'athletic' | 'average' | 'curvy' | 'muscular';
  
  // Rosto
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
  skinTone: string;
  eyeColor: string;
  eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned';
  eyebrowStyle: 'natural' | 'arched' | 'straight' | 'thick' | 'thin';
  noseShape: 'straight' | 'button' | 'roman' | 'wide' | 'narrow';
  lipShape: 'full' | 'thin' | 'heart' | 'wide' | 'small';
  
  // Cabelo
  hairStyle: string;
  hairColor: string;
  hairLength: 'bald' | 'short' | 'medium' | 'long' | 'very-long';
  hairTexture: 'straight' | 'wavy' | 'curly' | 'coily';
  
  // Roupas
  topStyle: string;
  bottomStyle: string;
  shoeStyle: string;
  outfitColor: string;
  
  // Acessórios
  glasses: string | null;
  jewelry: string[];
  hat: string | null;
  makeup: {
    foundation: boolean;
    eyeshadow: string;
    lipstick: string;
    blush: boolean;
  };
}

interface AppearanceCustomizerProps {
  onSettingsChange?: (settings: AppearanceSettings) => void;
  onPresetSave?: (name: string, settings: AppearanceSettings) => void;
  onPresetLoad?: (settings: AppearanceSettings) => void;
}

export default function AppearanceCustomizer({ 
  onSettingsChange, 
  onPresetSave, 
  onPresetLoad 
}: AppearanceCustomizerProps) {
  const [settings, setSettings] = useState<AppearanceSettings>({
    gender: 'female',
    age: 25,
    height: 165,
    bodyType: 'average',
    faceShape: 'oval',
    skinTone: '#F4C2A1',
    eyeColor: '#8B4513',
    eyeShape: 'almond',
    eyebrowStyle: 'natural',
    noseShape: 'straight',
    lipShape: 'full',
    hairStyle: 'long-wavy',
    hairColor: '#8B4513',
    hairLength: 'long',
    hairTexture: 'wavy',
    topStyle: 'blouse',
    bottomStyle: 'jeans',
    shoeStyle: 'sneakers',
    outfitColor: '#4A90E2',
    glasses: null,
    jewelry: [],
    hat: null,
    makeup: {
      foundation: true,
      eyeshadow: '#E6B3BA',
      lipstick: '#D2691E',
      blush: true
    }
  });

  const [presetName, setPresetName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Presets pré-definidos
  const presets = [
    { name: 'Casual Feminino', settings: { ...settings, topStyle: 'camiseta', bottomStyle: 'jeans' } },
    { name: 'Executivo Masculino', settings: { ...settings, gender: 'male', topStyle: 'terno', bottomStyle: 'calça-social' } },
    { name: 'Estilo Jovem', settings: { ...settings, age: 20, topStyle: 'moletom', bottomStyle: 'shorts' } },
    { name: 'Elegante', settings: { ...settings, topStyle: 'vestido', jewelry: ['colar', 'brincos'] } }
  ];

  const updateSetting = (key: keyof AppearanceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const randomizeAppearance = () => {
    setIsGenerating(true);
    
    // Simular geração aleatória
    setTimeout(() => {
      const randomSettings: AppearanceSettings = {
        ...settings,
        age: Math.floor(Math.random() * 40) + 18,
        skinTone: ['#F4C2A1', '#E8B887', '#D4A574', '#C19A6B', '#8B4513'][Math.floor(Math.random() * 5)],
        hairColor: ['#8B4513', '#000000', '#FFD700', '#FF6347', '#8A2BE2'][Math.floor(Math.random() * 5)],
        eyeColor: ['#8B4513', '#4169E1', '#228B22', '#808080', '#000000'][Math.floor(Math.random() * 5)],
        outfitColor: ['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6'][Math.floor(Math.random() * 5)]
      };
      
      setSettings(randomSettings);
      onSettingsChange?.(randomSettings);
      setIsGenerating(false);
    }, 2000);
  };

  const savePreset = () => {
    if (presetName.trim()) {
      onPresetSave?.(presetName, settings);
      setPresetName('');
    }
  };

  const loadPreset = (presetSettings: AppearanceSettings) => {
    setSettings(presetSettings);
    onSettingsChange?.(presetSettings);
    onPresetLoad?.(presetSettings);
  };

  const resetToDefault = () => {
    const defaultSettings: AppearanceSettings = {
      gender: 'female',
      age: 25,
      height: 165,
      bodyType: 'average',
      faceShape: 'oval',
      skinTone: '#F4C2A1',
      eyeColor: '#8B4513',
      eyeShape: 'almond',
      eyebrowStyle: 'natural',
      noseShape: 'straight',
      lipShape: 'full',
      hairStyle: 'long-wavy',
      hairColor: '#8B4513',
      hairLength: 'long',
      hairTexture: 'wavy',
      topStyle: 'blouse',
      bottomStyle: 'jeans',
      shoeStyle: 'sneakers',
      outfitColor: '#4A90E2',
      glasses: null,
      jewelry: [],
      hat: null,
      makeup: {
        foundation: true,
        eyeshadow: '#E6B3BA',
        lipstick: '#D2691E',
        blush: true
      }
    };
    
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customização de Aparência
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={randomizeAppearance} disabled={isGenerating} variant="outline" size="sm">
              <Shuffle className="h-4 w-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Aleatório'}
            </Button>
            <Button onClick={resetToDefault} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="physical" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="physical">Físico</TabsTrigger>
              <TabsTrigger value="face">Rosto</TabsTrigger>
              <TabsTrigger value="hair">Cabelo</TabsTrigger>
              <TabsTrigger value="clothing">Roupas</TabsTrigger>
              <TabsTrigger value="accessories">Acessórios</TabsTrigger>
            </TabsList>

            <TabsContent value="physical" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Características Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Características Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Gênero</Label>
                      <div className="flex gap-2 mt-2">
                        {['male', 'female', 'non-binary'].map((gender) => (
                          <Button
                            key={gender}
                            variant={settings.gender === gender ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('gender', gender)}
                          >
                            {gender === 'male' ? 'Masculino' : gender === 'female' ? 'Feminino' : 'Não-binário'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Idade: {settings.age} anos</Label>
                      <Slider
                        value={[settings.age]}
                        onValueChange={(value) => updateSetting('age', value[0])}
                        max={80}
                        min={18}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Altura: {settings.height} cm</Label>
                      <Slider
                        value={[settings.height]}
                        onValueChange={(value) => updateSetting('height', value[0])}
                        max={200}
                        min={140}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Tipo Corporal</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['slim', 'athletic', 'average', 'curvy', 'muscular'].map((type) => (
                          <Button
                            key={type}
                            variant={settings.bodyType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('bodyType', type)}
                          >
                            {type === 'slim' ? 'Magro' : 
                             type === 'athletic' ? 'Atlético' :
                             type === 'average' ? 'Médio' :
                             type === 'curvy' ? 'Curvilíneo' : 'Musculoso'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tom de Pele */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tom de Pele</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Cor da Pele</Label>
                      <div className="flex gap-2 mt-2">
                        {['#F4C2A1', '#E8B887', '#D4A574', '#C19A6B', '#8B4513'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              settings.skinTone === color ? 'border-black' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateSetting('skinTone', color)}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={settings.skinTone}
                        onChange={(e) => updateSetting('skinTone', e.target.value)}
                        className="mt-2 w-full h-10"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="face" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formato do Rosto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Formato do Rosto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Formato</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['oval', 'round', 'square', 'heart', 'diamond'].map((shape) => (
                          <Button
                            key={shape}
                            variant={settings.faceShape === shape ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('faceShape', shape)}
                          >
                            {shape === 'oval' ? 'Oval' :
                             shape === 'round' ? 'Redondo' :
                             shape === 'square' ? 'Quadrado' :
                             shape === 'heart' ? 'Coração' : 'Diamante'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Olhos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Olhos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Cor dos Olhos</Label>
                      <div className="flex gap-2 mt-2">
                        {['#8B4513', '#4169E1', '#228B22', '#808080', '#000000'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              settings.eyeColor === color ? 'border-black' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateSetting('eyeColor', color)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Formato dos Olhos</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['almond', 'round', 'hooded', 'monolid', 'upturned'].map((shape) => (
                          <Button
                            key={shape}
                            variant={settings.eyeShape === shape ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('eyeShape', shape)}
                          >
                            {shape === 'almond' ? 'Amendoado' :
                             shape === 'round' ? 'Redondo' :
                             shape === 'hooded' ? 'Encapuzado' :
                             shape === 'monolid' ? 'Monolid' : 'Levantado'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hair" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    Cabelo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Cor do Cabelo</Label>
                      <div className="flex gap-2 mt-2">
                        {['#8B4513', '#000000', '#FFD700', '#FF6347', '#8A2BE2'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              settings.hairColor === color ? 'border-black' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateSetting('hairColor', color)}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={settings.hairColor}
                        onChange={(e) => updateSetting('hairColor', e.target.value)}
                        className="mt-2 w-full h-10"
                      />
                    </div>

                    <div>
                      <Label>Comprimento</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['bald', 'short', 'medium', 'long', 'very-long'].map((length) => (
                          <Button
                            key={length}
                            variant={settings.hairLength === length ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('hairLength', length)}
                          >
                            {length === 'bald' ? 'Careca' :
                             length === 'short' ? 'Curto' :
                             length === 'medium' ? 'Médio' :
                             length === 'long' ? 'Longo' : 'Muito Longo'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Textura</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {['straight', 'wavy', 'curly', 'coily'].map((texture) => (
                        <Button
                          key={texture}
                          variant={settings.hairTexture === texture ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('hairTexture', texture)}
                        >
                          {texture === 'straight' ? 'Liso' :
                           texture === 'wavy' ? 'Ondulado' :
                           texture === 'curly' ? 'Cacheado' : 'Crespo'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clothing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shirt className="h-5 w-5" />
                    Roupas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>Parte Superior</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {['camiseta', 'blouse', 'terno', 'moletom', 'vestido'].map((style) => (
                          <Button
                            key={style}
                            variant={settings.topStyle === style ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('topStyle', style)}
                          >
                            {style === 'camiseta' ? 'Camiseta' :
                             style === 'blouse' ? 'Blusa' :
                             style === 'terno' ? 'Terno' :
                             style === 'moletom' ? 'Moletom' : 'Vestido'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Parte Inferior</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {['jeans', 'calça-social', 'shorts', 'saia', 'legging'].map((style) => (
                          <Button
                            key={style}
                            variant={settings.bottomStyle === style ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('bottomStyle', style)}
                          >
                            {style === 'jeans' ? 'Jeans' :
                             style === 'calça-social' ? 'Calça Social' :
                             style === 'shorts' ? 'Shorts' :
                             style === 'saia' ? 'Saia' : 'Legging'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Calçados</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {['sneakers', 'sapato-social', 'sandália', 'bota', 'salto'].map((style) => (
                          <Button
                            key={style}
                            variant={settings.shoeStyle === style ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('shoeStyle', style)}
                          >
                            {style === 'sneakers' ? 'Tênis' :
                             style === 'sapato-social' ? 'Sapato Social' :
                             style === 'sandália' ? 'Sandália' :
                             style === 'bota' ? 'Bota' : 'Salto Alto'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Cor da Roupa</Label>
                    <div className="flex gap-2 mt-2">
                      {['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6'].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            settings.outfitColor === color ? 'border-black' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateSetting('outfitColor', color)}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={settings.outfitColor}
                      onChange={(e) => updateSetting('outfitColor', e.target.value)}
                      className="mt-2 w-full h-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accessories" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Glasses className="h-5 w-5" />
                      Acessórios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Óculos</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[null, 'óculos-grau', 'óculos-sol', 'óculos-leitura'].map((style) => (
                          <Button
                            key={style || 'none'}
                            variant={settings.glasses === style ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('glasses', style)}
                          >
                            {style === null ? 'Nenhum' :
                             style === 'óculos-grau' ? 'Óculos de Grau' :
                             style === 'óculos-sol' ? 'Óculos de Sol' : 'Óculos de Leitura'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Chapéu</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[null, 'boné', 'chapéu', 'gorro'].map((style) => (
                          <Button
                            key={style || 'none'}
                            variant={settings.hat === style ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSetting('hat', style)}
                          >
                            {style === null ? 'Nenhum' :
                             style === 'boné' ? 'Boné' :
                             style === 'chapéu' ? 'Chapéu' : 'Gorro'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gem className="h-5 w-5" />
                      Maquiagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Sombra</Label>
                      <Input
                        type="color"
                        value={settings.makeup.eyeshadow}
                        onChange={(e) => updateSetting('makeup', { ...settings.makeup, eyeshadow: e.target.value })}
                        className="mt-2 w-full h-10"
                      />
                    </div>

                    <div>
                      <Label>Batom</Label>
                      <Input
                        type="color"
                        value={settings.makeup.lipstick}
                        onChange={(e) => updateSetting('makeup', { ...settings.makeup, lipstick: e.target.value })}
                        className="mt-2 w-full h-10"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Presets */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    onClick={() => loadPreset(preset.settings as AppearanceSettings)}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Crown className="h-6 w-6" />
                    <span className="text-sm">{preset.name}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nome do preset..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={savePreset} disabled={!presetName.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
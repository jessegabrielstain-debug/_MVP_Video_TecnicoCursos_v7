/**
 * 🎭 Personality Presets - Sistema de Presets de Personalidade
 * Presets completos de personalidade com comportamentos, expressões e vozes
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
  Heart,
  Brain,
  Zap,
  Star,
  Smile,
  Frown,
  Meh,
  Angry,
  Coffee,
  Briefcase,
  GraduationCap,
  Palette,
  Music,
  Gamepad2,
  Book,
  Mic,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Save,
  Upload,
  Download,
  Shuffle,
  Settings,
  Eye,
  MessageCircle,
  Activity,
  Target,
  Award,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PersonalityTrait {
  name: string;
  value: number; // 0-100
  description: string;
}

interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  expressions: string[];
  gestures: string[];
  voiceModulation: {
    pitch: number;
    speed: number;
    emotion: string;
  };
}

interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'casual' | 'creative' | 'educational' | 'entertainment';
  avatar: {
    appearance: string;
    style: string;
  };
  
  // Traços de Personalidade (Big Five + extras)
  traits: {
    openness: number;        // Abertura para experiências
    conscientiousness: number; // Conscienciosidade
    extraversion: number;    // Extroversão
    agreeableness: number;   // Amabilidade
    neuroticism: number;     // Neuroticismo
    confidence: number;      // Confiança
    enthusiasm: number;      // Entusiasmo
    empathy: number;         // Empatia
    humor: number;           // Senso de humor
    formality: number;       // Formalidade
  };
  
  // Padrões de Comportamento
  behaviors: BehaviorPattern[];
  
  // Configurações de Voz
  voice: {
    baseVoice: string;
    pitch: number;
    speed: number;
    volume: number;
    accent: string;
    emotionalRange: number;
  };
  
  // Expressões Favoritas
  favoriteExpressions: string[];
  
  // Gestos Característicos
  characteristicGestures: string[];
  
  // Frases e Respostas Típicas
  typicalPhrases: {
    greeting: string[];
    agreement: string[];
    disagreement: string[];
    thinking: string[];
    excitement: string[];
    farewell: string[];
  };
}

interface PersonalityPresetsProps {
  avatarId: string;
  onPersonalityChange?: (preset: PersonalityPreset) => void;
  currentPersonality?: Partial<PersonalityPreset>;
}

export default function PersonalityPresets({ 
  avatarId, 
  onPersonalityChange,
  currentPersonality 
}: PersonalityPresetsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Estado da personalidade atual
  const [selectedPreset, setSelectedPreset] = useState<PersonalityPreset | null>(null);
  const [customPersonality, setCustomPersonality] = useState<PersonalityPreset>({
    id: 'custom',
    name: 'Personalidade Customizada',
    description: 'Personalidade criada pelo usuário',
    category: 'casual',
    avatar: {
      appearance: 'neutral',
      style: 'casual'
    },
    traits: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 30,
      confidence: 60,
      enthusiasm: 50,
      empathy: 60,
      humor: 40,
      formality: 40
    },
    behaviors: [],
    voice: {
      baseVoice: 'neutral',
      pitch: 50,
      speed: 50,
      volume: 70,
      accent: 'neutral',
      emotionalRange: 60
    },
    favoriteExpressions: ['smile', 'nod', 'thinking'],
    characteristicGestures: ['hand_wave', 'thumbs_up'],
    typicalPhrases: {
      greeting: ['Olá!', 'Oi, como vai?', 'Prazer em conhecê-lo!'],
      agreement: ['Exato!', 'Concordo plenamente', 'Isso mesmo!'],
      disagreement: ['Hmm, não tenho certeza', 'Vejo de forma diferente', 'Interessante perspectiva'],
      thinking: ['Deixe-me pensar...', 'Hmm...', 'Boa pergunta...'],
      excitement: ['Fantástico!', 'Que incrível!', 'Adorei!'],
      farewell: ['Até logo!', 'Foi um prazer!', 'Nos vemos em breve!']
    }
  });

  // Presets predefinidos
  const predefinedPresets: PersonalityPreset[] = [
    {
      id: 'professional_executive',
      name: 'Executivo Profissional',
      description: 'Confiante, direto e focado em resultados',
      category: 'professional',
      avatar: {
        appearance: 'formal',
        style: 'business'
      },
      traits: {
        openness: 70,
        conscientiousness: 90,
        extraversion: 80,
        agreeableness: 60,
        neuroticism: 20,
        confidence: 95,
        enthusiasm: 70,
        empathy: 50,
        humor: 30,
        formality: 90
      },
      behaviors: [
        {
          id: 'decisive_response',
          name: 'Resposta Decisiva',
          description: 'Responde de forma direta e confiante',
          triggers: ['question', 'decision_needed'],
          expressions: ['confident_smile', 'serious_look'],
          gestures: ['firm_handshake', 'pointing'],
          voiceModulation: { pitch: 45, speed: 60, emotion: 'confident' }
        }
      ],
      voice: {
        baseVoice: 'professional_male',
        pitch: 45,
        speed: 60,
        volume: 80,
        accent: 'neutral',
        emotionalRange: 40
      },
      favoriteExpressions: ['confident_smile', 'serious_nod', 'firm_look'],
      characteristicGestures: ['firm_handshake', 'pointing', 'crossed_arms'],
      typicalPhrases: {
        greeting: ['Bom dia', 'Prazer em conhecê-lo', 'Vamos direto ao ponto'],
        agreement: ['Excelente', 'Perfeito', 'Vamos em frente'],
        disagreement: ['Preciso discordar', 'Vejo isso diferente', 'Não é viável'],
        thinking: ['Analisando...', 'Considerando as opções...', 'Estrategicamente...'],
        excitement: ['Excelente resultado!', 'Superou expectativas!', 'Objetivo alcançado!'],
        farewell: ['Até a próxima reunião', 'Bom trabalho', 'Mantenha o foco']
      }
    },
    {
      id: 'friendly_teacher',
      name: 'Professor Amigável',
      description: 'Paciente, empático e didático',
      category: 'educational',
      avatar: {
        appearance: 'warm',
        style: 'casual_professional'
      },
      traits: {
        openness: 85,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 90,
        neuroticism: 25,
        confidence: 75,
        enthusiasm: 85,
        empathy: 95,
        humor: 70,
        formality: 60
      },
      behaviors: [
        {
          id: 'encouraging_response',
          name: 'Resposta Encorajadora',
          description: 'Sempre encoraja e motiva o aprendizado',
          triggers: ['student_question', 'mistake', 'confusion'],
          expressions: ['warm_smile', 'encouraging_nod'],
          gestures: ['open_hands', 'gentle_pointing'],
          voiceModulation: { pitch: 55, speed: 45, emotion: 'encouraging' }
        }
      ],
      voice: {
        baseVoice: 'warm_female',
        pitch: 55,
        speed: 45,
        volume: 75,
        accent: 'neutral',
        emotionalRange: 70
      },
      favoriteExpressions: ['warm_smile', 'encouraging_nod', 'thinking_pose'],
      characteristicGestures: ['open_hands', 'gentle_pointing', 'applause'],
      typicalPhrases: {
        greeting: ['Olá, queridos!', 'Bem-vindos!', 'Como estão hoje?'],
        agreement: ['Muito bem!', 'Excelente raciocínio!', 'Perfeito!'],
        disagreement: ['Vamos pensar juntos...', 'Que tal tentarmos assim?', 'Interessante, mas...'],
        thinking: ['Hmm, boa pergunta...', 'Vamos explorar isso...', 'Deixe-me explicar...'],
        excitement: ['Fantástico!', 'Vocês são incríveis!', 'Que progresso maravilhoso!'],
        farewell: ['Até a próxima aula!', 'Continuem estudando!', 'Estou orgulhosa de vocês!']
      }
    },
    {
      id: 'creative_artist',
      name: 'Artista Criativo',
      description: 'Expressivo, imaginativo e inspirador',
      category: 'creative',
      avatar: {
        appearance: 'artistic',
        style: 'bohemian'
      },
      traits: {
        openness: 95,
        conscientiousness: 60,
        extraversion: 75,
        agreeableness: 80,
        neuroticism: 40,
        confidence: 70,
        enthusiasm: 90,
        empathy: 85,
        humor: 80,
        formality: 20
      },
      behaviors: [
        {
          id: 'expressive_response',
          name: 'Resposta Expressiva',
          description: 'Usa gestos amplos e expressões dramáticas',
          triggers: ['inspiration', 'creativity', 'art_discussion'],
          expressions: ['inspired_look', 'dramatic_expression'],
          gestures: ['wide_gestures', 'artistic_pose'],
          voiceModulation: { pitch: 60, speed: 40, emotion: 'passionate' }
        }
      ],
      voice: {
        baseVoice: 'expressive_neutral',
        pitch: 60,
        speed: 40,
        volume: 70,
        accent: 'artistic',
        emotionalRange: 90
      },
      favoriteExpressions: ['inspired_look', 'dreamy_smile', 'passionate_gaze'],
      characteristicGestures: ['wide_gestures', 'artistic_pose', 'paint_brush_motion'],
      typicalPhrases: {
        greeting: ['Que energia maravilhosa!', 'Olá, alma criativa!', 'Bem-vindo ao mundo da arte!'],
        agreement: ['Genial!', 'Que visão incrível!', 'Pura inspiração!'],
        disagreement: ['Hmm, vejo cores diferentes...', 'Que tal explorarmos outras texturas?', 'Interessante perspectiva...'],
        thinking: ['Deixe a criatividade fluir...', 'Sinto a inspiração chegando...', 'Que possibilidades...'],
        excitement: ['Magnífico!', 'Pura arte!', 'Isso é revolucionário!'],
        farewell: ['Continue criando!', 'Que a inspiração esteja com você!', 'Arte é vida!']
      }
    },
    {
      id: 'tech_enthusiast',
      name: 'Entusiasta de Tecnologia',
      description: 'Curioso, analítico e inovador',
      category: 'professional',
      avatar: {
        appearance: 'modern',
        style: 'tech_casual'
      },
      traits: {
        openness: 90,
        conscientiousness: 75,
        extraversion: 60,
        agreeableness: 70,
        neuroticism: 30,
        confidence: 80,
        enthusiasm: 85,
        empathy: 60,
        humor: 60,
        formality: 40
      },
      behaviors: [
        {
          id: 'analytical_response',
          name: 'Resposta Analítica',
          description: 'Aborda problemas de forma sistemática e lógica',
          triggers: ['technical_question', 'problem_solving', 'innovation'],
          expressions: ['focused_look', 'curious_expression'],
          gestures: ['typing_motion', 'screen_pointing'],
          voiceModulation: { pitch: 50, speed: 55, emotion: 'analytical' }
        }
      ],
      voice: {
        baseVoice: 'tech_male',
        pitch: 50,
        speed: 55,
        volume: 75,
        accent: 'neutral',
        emotionalRange: 60
      },
      favoriteExpressions: ['focused_look', 'curious_smile', 'aha_moment'],
      characteristicGestures: ['typing_motion', 'screen_pointing', 'gadget_handling'],
      typicalPhrases: {
        greeting: ['E aí, pessoal!', 'Olá, fellow developers!', 'Prontos para inovar?'],
        agreement: ['Exato!', 'Faz total sentido!', 'Algoritmo perfeito!'],
        disagreement: ['Hmm, vejo um bug aí...', 'Que tal refatorarmos isso?', 'Interessante approach...'],
        thinking: ['Debugando...', 'Processando...', 'Analisando o código...'],
        excitement: ['Isso é épico!', 'Game changer!', 'Next level!'],
        farewell: ['Happy coding!', 'Até o próximo deploy!', 'Keep innovating!']
      }
    },
    {
      id: 'casual_friend',
      name: 'Amigo Casual',
      description: 'Descontraído, divertido e acessível',
      category: 'casual',
      avatar: {
        appearance: 'friendly',
        style: 'casual'
      },
      traits: {
        openness: 75,
        conscientiousness: 50,
        extraversion: 85,
        agreeableness: 90,
        neuroticism: 25,
        confidence: 70,
        enthusiasm: 80,
        empathy: 85,
        humor: 90,
        formality: 20
      },
      behaviors: [
        {
          id: 'friendly_response',
          name: 'Resposta Amigável',
          description: 'Sempre mantém um tom descontraído e amigável',
          triggers: ['casual_conversation', 'jokes', 'personal_topics'],
          expressions: ['big_smile', 'laugh', 'wink'],
          gestures: ['casual_wave', 'thumbs_up', 'high_five'],
          voiceModulation: { pitch: 55, speed: 50, emotion: 'cheerful' }
        }
      ],
      voice: {
        baseVoice: 'friendly_neutral',
        pitch: 55,
        speed: 50,
        volume: 70,
        accent: 'casual',
        emotionalRange: 80
      },
      favoriteExpressions: ['big_smile', 'laugh', 'wink', 'surprised_happy'],
      characteristicGestures: ['casual_wave', 'thumbs_up', 'high_five', 'shoulder_shrug'],
      typicalPhrases: {
        greeting: ['E aí!', 'Opa, beleza?', 'Fala aí!', 'Tudo certo?'],
        agreement: ['Massa!', 'Exato!', 'Concordo total!', 'É isso aí!'],
        disagreement: ['Ah, sei lá...', 'Não sei não...', 'Hmm, acho que não...', 'Talvez...'],
        thinking: ['Deixa eu ver...', 'Hmm...', 'Boa pergunta...', 'Vou pensar...'],
        excitement: ['Que massa!', 'Incrível!', 'Demais!', 'Show de bola!'],
        farewell: ['Falou!', 'Até mais!', 'Tchau tchau!', 'Nos vemos!']
      }
    }
  ];

  // Aplicar preset
  const applyPreset = (preset: PersonalityPreset) => {
    setSelectedPreset(preset);
    setCustomPersonality(preset);
    if (onPersonalityChange) {
      onPersonalityChange(preset);
    }
    toast.success(`Personalidade "${preset.name}" aplicada!`);
  };

  // Atualizar traço de personalidade
  const updateTrait = (trait: keyof PersonalityPreset['traits'], value: number) => {
    setCustomPersonality(prev => ({
      ...prev,
      traits: {
        ...prev.traits,
        [trait]: value
      }
    }));
  };

  // Atualizar configuração de voz
  const updateVoice = (setting: keyof PersonalityPreset['voice'], value: string | number) => {
    setCustomPersonality(prev => ({
      ...prev,
      voice: {
        ...prev.voice,
        [setting]: value
      }
    }));
  };

  // Randomizar personalidade
  const randomizePersonality = () => {
    const randomTraits = Object.keys(customPersonality.traits).reduce((acc, trait) => ({
      ...acc,
      [trait]: Math.floor(Math.random() * 100)
    }), {} as PersonalityPreset['traits']);

    setCustomPersonality(prev => ({
      ...prev,
      traits: randomTraits,
      voice: {
        ...prev.voice,
        pitch: Math.floor(Math.random() * 100),
        speed: Math.floor(Math.random() * 100),
        emotionalRange: Math.floor(Math.random() * 100)
      }
    }));

    toast.success('Personalidade randomizada!');
  };

  // Salvar personalidade customizada
  const saveCustomPersonality = () => {
    const dataStr = JSON.stringify(customPersonality, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `personality-${customPersonality.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Personalidade salva!');
  };

  // Carregar personalidade
  const loadPersonality = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const personality = JSON.parse(e.target?.result as string);
        setCustomPersonality(personality);
        setSelectedPreset(personality);
        toast.success('Personalidade carregada!');
      } catch (error) {
        toast.error('Erro ao carregar personalidade');
      }
    };
    reader.readAsText(file);
  };

  // Renderizar radar de personalidade
  const renderPersonalityRadar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Traços principais (Big Five)
    const mainTraits = [
      { name: 'Abertura', value: customPersonality.traits.openness, angle: 0 },
      { name: 'Consciência', value: customPersonality.traits.conscientiousness, angle: Math.PI * 2 / 5 },
      { name: 'Extroversão', value: customPersonality.traits.extraversion, angle: Math.PI * 4 / 5 },
      { name: 'Amabilidade', value: customPersonality.traits.agreeableness, angle: Math.PI * 6 / 5 },
      { name: 'Neuroticismo', value: customPersonality.traits.neuroticism, angle: Math.PI * 8 / 5 }
    ];

    // Desenhar círculos de referência
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Desenhar linhas de referência
    mainTraits.forEach(trait => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(trait.angle - Math.PI / 2) * radius,
        centerY + Math.sin(trait.angle - Math.PI / 2) * radius
      );
      ctx.stroke();
    });

    // Desenhar polígono da personalidade
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    mainTraits.forEach((trait, index) => {
      const traitRadius = (radius * trait.value) / 100;
      const x = centerX + Math.cos(trait.angle - Math.PI / 2) * traitRadius;
      const y = centerY + Math.sin(trait.angle - Math.PI / 2) * traitRadius;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Desenhar pontos
    ctx.fillStyle = '#3b82f6';
    mainTraits.forEach(trait => {
      const traitRadius = (radius * trait.value) / 100;
      const x = centerX + Math.cos(trait.angle - Math.PI / 2) * traitRadius;
      const y = centerY + Math.sin(trait.angle - Math.PI / 2) * traitRadius;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Desenhar labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    mainTraits.forEach(trait => {
      const labelRadius = radius + 15;
      const x = centerX + Math.cos(trait.angle - Math.PI / 2) * labelRadius;
      const y = centerY + Math.sin(trait.angle - Math.PI / 2) * labelRadius;
      
      ctx.fillText(trait.name, x, y);
    });
  };

  useEffect(() => {
    renderPersonalityRadar();
  }, [customPersonality.traits]);

  return (
    <div className="space-y-6">
      {/* Presets Predefinidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Presets de Personalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedPresets.map((preset) => (
              <Card 
                key={preset.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPreset?.id === preset.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{preset.name}</h3>
                      <Badge variant="outline">{preset.category}</Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600">{preset.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Extroversão</span>
                        <span>{preset.traits.extraversion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full" 
                          style={{ width: `${preset.traits.extraversion}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span>Confiança</span>
                        <span>{preset.traits.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full" 
                          style={{ width: `${preset.traits.confidence}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span>Humor</span>
                        <span>{preset.traits.humor}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-yellow-500 h-1 rounded-full" 
                          style={{ width: `${preset.traits.humor}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radar de Personalidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Radar de Personalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="border rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Controles
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={randomizePersonality}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Randomizar
                </Button>
                <Button variant="outline" size="sm" onClick={saveCustomPersonality}>
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
                    onChange={loadPersonality}
                    className="hidden"
                  />
                </label>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Nome da Personalidade</Label>
                <Input
                  value={customPersonality.name}
                  onChange={(e) => setCustomPersonality(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <Input
                  value={customPersonality.description}
                  onChange={(e) => setCustomPersonality(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customização Detalhada */}
      <Tabs defaultValue="traits" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traits">Traços</TabsTrigger>
          <TabsTrigger value="voice">Voz</TabsTrigger>
          <TabsTrigger value="behaviors">Comportamentos</TabsTrigger>
          <TabsTrigger value="phrases">Frases</TabsTrigger>
        </TabsList>

        <TabsContent value="traits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Traços de Personalidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Big Five */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Big Five (Principais)
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'openness', label: 'Abertura para Experiências', description: 'Criatividade e curiosidade' },
                    { key: 'conscientiousness', label: 'Conscienciosidade', description: 'Organização e disciplina' },
                    { key: 'extraversion', label: 'Extroversão', description: 'Sociabilidade e energia' },
                    { key: 'agreeableness', label: 'Amabilidade', description: 'Cooperação e confiança' },
                    { key: 'neuroticism', label: 'Neuroticismo', description: 'Estabilidade emocional (inverso)' }
                  ].map(({ key, label, description }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <Label className="font-medium">{label}</Label>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                        <Badge variant="outline">
                          {customPersonality.traits[key as keyof typeof customPersonality.traits]}%
                        </Badge>
                      </div>
                      <Slider
                        value={[customPersonality.traits[key as keyof typeof customPersonality.traits]]}
                        onValueChange={([value]) => updateTrait(key as keyof typeof customPersonality.traits, value)}
                        min={0}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Traços Adicionais */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Traços Adicionais
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'confidence', label: 'Confiança', description: 'Autoestima e segurança' },
                    { key: 'enthusiasm', label: 'Entusiasmo', description: 'Energia e motivação' },
                    { key: 'empathy', label: 'Empatia', description: 'Compreensão emocional' },
                    { key: 'humor', label: 'Senso de Humor', description: 'Capacidade de ser divertido' },
                    { key: 'formality', label: 'Formalidade', description: 'Nível de protocolo' }
                  ].map(({ key, label, description }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <Label className="font-medium">{label}</Label>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                        <Badge variant="outline">
                          {customPersonality.traits[key as keyof typeof customPersonality.traits]}%
                        </Badge>
                      </div>
                      <Slider
                        value={[customPersonality.traits[key as keyof typeof customPersonality.traits]]}
                        onValueChange={([value]) => updateTrait(key as keyof typeof customPersonality.traits, value)}
                        min={0}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Configurações de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Voz Base</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['neutral', 'professional_male', 'warm_female', 'expressive_neutral', 'tech_male', 'friendly_neutral'].map((voice) => (
                      <Button
                        key={voice}
                        variant={customPersonality.voice.baseVoice === voice ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateVoice('baseVoice', voice)}
                      >
                        {voice.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Sotaque</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['neutral', 'casual', 'artistic', 'formal'].map((accent) => (
                      <Button
                        key={accent}
                        variant={customPersonality.voice.accent === accent ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateVoice('accent', accent)}
                      >
                        {accent.charAt(0).toUpperCase() + accent.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tom (Pitch): {customPersonality.voice.pitch}%</Label>
                  <Slider
                    value={[customPersonality.voice.pitch]}
                    onValueChange={([pitch]) => updateVoice('pitch', pitch)}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Velocidade: {customPersonality.voice.speed}%</Label>
                  <Slider
                    value={[customPersonality.voice.speed]}
                    onValueChange={([speed]) => updateVoice('speed', speed)}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Volume: {customPersonality.voice.volume}%</Label>
                  <Slider
                    value={[customPersonality.voice.volume]}
                    onValueChange={([volume]) => updateVoice('volume', volume)}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Variação Emocional: {customPersonality.voice.emotionalRange}%</Label>
                  <Slider
                    value={[customPersonality.voice.emotionalRange]}
                    onValueChange={([emotionalRange]) => updateVoice('emotionalRange', emotionalRange)}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Testar Voz
                </Button>
                <Button variant="outline" size="sm">
                  <Mic className="w-4 h-4 mr-2" />
                  Gravar Amostra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behaviors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Padrões de Comportamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Expressões Favoritas</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['smile', 'nod', 'thinking', 'wink', 'laugh', 'serious', 'surprised', 'confident'].map((expression) => (
                      <label key={expression} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customPersonality.favoriteExpressions.includes(expression)}
                          onChange={(e) => {
                            const expressions = e.target.checked
                              ? [...customPersonality.favoriteExpressions, expression]
                              : customPersonality.favoriteExpressions.filter(exp => exp !== expression);
                            setCustomPersonality(prev => ({ ...prev, favoriteExpressions: expressions }));
                          }}
                        />
                        <span className="text-sm">{expression}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Gestos Característicos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['hand_wave', 'thumbs_up', 'pointing', 'applause', 'handshake', 'crossed_arms', 'open_hands', 'high_five'].map((gesture) => (
                      <label key={gesture} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customPersonality.characteristicGestures.includes(gesture)}
                          onChange={(e) => {
                            const gestures = e.target.checked
                              ? [...customPersonality.characteristicGestures, gesture]
                              : customPersonality.characteristicGestures.filter(gest => gest !== gesture);
                            setCustomPersonality(prev => ({ ...prev, characteristicGestures: gestures }));
                          }}
                        />
                        <span className="text-sm">{gesture.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phrases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Frases Típicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(customPersonality.typicalPhrases).map(([category, phrases]) => (
                <div key={category}>
                  <Label className="capitalize">{category.replace('_', ' ')}</Label>
                  <div className="space-y-2 mt-2">
                    {phrases.map((phrase, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={phrase}
                          onChange={(e) => {
                            const newPhrases = [...phrases];
                            newPhrases[index] = e.target.value;
                            setCustomPersonality(prev => ({
                              ...prev,
                              typicalPhrases: {
                                ...prev.typicalPhrases,
                                [category]: newPhrases
                              }
                            }));
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPhrases = phrases.filter((_, i) => i !== index);
                            setCustomPersonality(prev => ({
                              ...prev,
                              typicalPhrases: {
                                ...prev.typicalPhrases,
                                [category]: newPhrases
                              }
                            }));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPhrases = [...phrases, ''];
                        setCustomPersonality(prev => ({
                          ...prev,
                          typicalPhrases: {
                            ...prev.typicalPhrases,
                            [category]: newPhrases
                          }
                        }));
                      }}
                    >
                      + Adicionar Frase
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
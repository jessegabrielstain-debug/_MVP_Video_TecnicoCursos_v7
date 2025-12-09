
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, Sparkles, Shield, Zap, Users } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function PublicOnboardingFunnel({ variant = 'A' }: { variant?: 'A' | 'B' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Estúdio IA',
      description: 'Transforme apresentações em vídeos inteligentes em minutos',
      completed: false,
    },
    {
      id: 'signup',
      title: 'Crie sua conta grátis',
      description: 'Comece agora sem cartão de crédito',
      completed: false,
    },
    {
      id: 'first-project',
      title: 'Crie seu primeiro vídeo',
      description: 'Upload de PPTX e geração automática',
      completed: false,
    },
    {
      id: 'explore',
      title: 'Explore recursos',
      description: 'Descubra TTS, avatares 3D e templates NR',
      completed: false,
    },
  ];

  // Variant A: Focus em facilidade e velocidade
  const benefitsA = [
    { icon: Zap, title: 'Rápido', description: 'Vídeos em 5 minutos' },
    { icon: Sparkles, title: 'Inteligente', description: 'IA de ponta' },
    { icon: Users, title: 'Colaborativo', description: 'Trabalhe em equipe' },
  ];

  // Variant B: Focus em compliance e profissionalismo
  const benefitsB = [
    { icon: Shield, title: 'Compliance NR', description: 'Templates certificados' },
    { icon: CheckCircle2, title: 'Profissional', description: 'Qualidade enterprise' },
    { icon: Users, title: 'Escalável', description: 'Para equipes de qualquer tamanho' },
  ];

  const benefits = variant === 'A' ? benefitsA : benefitsB;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSignup = async () => {
    // Track event
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'signup_initiated',
          variant,
          email,
          name,
        }),
      }).catch((error) => logger.error('Failed to track signup event', error instanceof Error ? error : new Error(String(error)), { component: 'PublicOnboardingFunnel' }));
    }

    // Proceed to signup
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {variant === 'A' ? '⚡ Crie Vídeos em Minutos' : '🎯 Vídeos Profissionais com IA'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {variant === 'A' 
              ? 'A forma mais rápida de transformar PPT em vídeo'
              : 'Plataforma completa de vídeos de treinamento com compliance NR'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${index <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                `}>
                  {index < currentStep ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
                </div>
                <span className="text-xs text-center">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo! 👋</CardTitle>
                <CardDescription>
                  Veja como é fácil criar vídeos profissionais com IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="text-center p-4 rounded-lg bg-muted">
                      <benefit.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  ))}
                </div>

                {/* Video Demo (Mockup) */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white opacity-80 cursor-pointer hover:opacity-100" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <Badge>2 min demo</Badge>
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Começar Agora →
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Crie sua conta grátis</CardTitle>
                <CardDescription>
                  Sem cartão de crédito. Cancele quando quiser.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email profissional</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Social Proof */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Mais de 1.000 empresas confiam</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Junte-se a profissionais de RH, SST e Treinamento que já transformaram
                    seus treinamentos com IA.
                  </p>
                </div>

                <Button onClick={handleSignup} className="w-full" size="lg" disabled={!email || !name}>
                  Criar Conta Grátis →
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar conta, você aceita nossos{' '}
                  <a href="/terms" className="underline">Termos</a> e{' '}
                  <a href="/privacy" className="underline">Política de Privacidade</a>
                </p>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Crie seu primeiro vídeo</CardTitle>
                <CardDescription>
                  Faça upload de um PPTX ou comece com um template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center cursor-pointer hover:bg-muted">
                  <div className="mb-4">
                    <PlayCircle className="h-12 w-12 mx-auto text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Upload PPTX</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <Button variant="outline">Escolher Arquivo</Button>
                </div>

                <div className="text-center">
                  <span className="text-muted-foreground">ou</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                    <div className="aspect-video bg-muted rounded mb-2" />
                    <p className="font-medium text-sm">Template NR12</p>
                    <p className="text-xs text-muted-foreground">Segurança em Máquinas</p>
                  </div>
                  <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                    <div className="aspect-video bg-muted rounded mb-2" />
                    <p className="font-medium text-sm">Template NR35</p>
                    <p className="text-xs text-muted-foreground">Trabalho em Altura</p>
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Continuar →
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>🎉 Conta criada com sucesso!</CardTitle>
                <CardDescription>
                  Explore os recursos e crie vídeos incríveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Próximos passos:</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>✓ Faça upload do seu primeiro PPTX</li>
                    <li>✓ Gere TTS com vozes profissionais</li>
                    <li>✓ Adicione avatares 3D hiper-realistas</li>
                    <li>✓ Exporte e compartilhe seu vídeo</li>
                  </ul>
                </div>

                <Button className="w-full" size="lg">
                  Ir para Dashboard →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer CTA */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda? <a href="/help" className="underline">Central de Ajuda</a> ou{' '}
            <a href="/contact" className="underline">Fale Conosco</a>
          </p>
        </div>
      </div>
    </div>
  );
}

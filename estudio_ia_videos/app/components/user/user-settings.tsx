'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Moon, Globe, Shield, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettingsProps {
  userId: string;
}

export function UserSettings({ userId }: UserSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      marketing: false,
    },
    appearance: {
      theme: 'system',
      compactMode: false,
    },
    privacy: {
      publicProfile: false,
      showActivity: true,
    }
  });

  const handleToggle = (category: keyof typeof settings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof settings],
        [setting]: !prev[category as keyof typeof settings][setting as keyof typeof settings[keyof typeof settings]]
      }
    }));
    toast.success('Configuração atualizada');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta e notificações.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize como o Estúdio IA Videos aparece para você.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="compact-mode" className="flex flex-col space-y-1">
                  <span>Modo Compacto</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Exibir mais conteúdo na tela reduzindo espaçamentos.
                  </span>
                </Label>
                <Switch
                  id="compact-mode"
                  checked={settings.appearance.compactMode}
                  onCheckedChange={() => handleToggle('appearance', 'compactMode')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Idioma e Região
              </CardTitle>
              <CardDescription>
                Defina suas preferências regionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Idioma</Label>
                <div className="p-2 border rounded-md bg-muted text-sm text-muted-foreground">
                  Português (Brasil) - Padrão do Sistema
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription>
                Escolha como você quer ser notificado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notif" className="flex flex-col space-y-1">
                  <span>Notificações por Email</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receber atualizações sobre seus projetos e renderizações.
                  </span>
                </Label>
                <Switch
                  id="email-notif"
                  checked={settings.notifications.email}
                  onCheckedChange={() => handleToggle('notifications', 'email')}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-notif" className="flex flex-col space-y-1">
                  <span>Notificações Push</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receber alertas no navegador.
                  </span>
                </Label>
                <Switch
                  id="push-notif"
                  checked={settings.notifications.push}
                  onCheckedChange={() => handleToggle('notifications', 'push')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade e Segurança
              </CardTitle>
              <CardDescription>
                Controle quem pode ver suas informações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="public-profile" className="flex flex-col space-y-1">
                  <span>Perfil Público</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Permitir que outros usuários vejam seu perfil básico.
                  </span>
                </Label>
                <Switch
                  id="public-profile"
                  checked={settings.privacy.publicProfile}
                  onCheckedChange={() => handleToggle('privacy', 'publicProfile')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

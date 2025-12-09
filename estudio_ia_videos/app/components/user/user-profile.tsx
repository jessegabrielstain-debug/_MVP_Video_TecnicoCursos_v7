'use client';

import React, { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Calendar, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/lib/supabase/database.types';

interface UserProfileProps {
  userId: string;
  editable?: boolean;
  showStats?: boolean;
  showActivity?: boolean;
}

type Profile = Database['public']['Tables']['users']['Row'];

export function UserProfile({ userId, editable = false, showStats = true, showActivity = false }: UserProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  const supabase = getBrowserClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.name || '',
            email: data.email || '',
          });
        }
      } catch (error) {
        logger.error('Error fetching profile', error instanceof Error ? error : new Error(String(error)), { component: 'UserProfile', userId });
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, supabase]);

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso');
      setIsEditing(false);

      // Refresh profile
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) setProfile(data);

    } catch (error) {
      logger.error('Error updating profile', error instanceof Error ? error : new Error(String(error)), { component: 'UserProfile', userId });
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Perfil não encontrado.
        </CardContent>
      </Card>
    );
  }

  const fullName = profile.name || 'Usuário';
  const initials = fullName.substring(0, 2).toUpperCase();
  const metadata = (profile.metadata as Record<string, unknown>) || {};
  const credits = (metadata.credits as number) || 0;
  const subscriptionTier = (metadata.subscription_tier as string) || 'Free';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{fullName}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {profile.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Membro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                  </span>
                </CardDescription>
              </div>
            </div>
            {editable && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar Perfil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Informações Pessoais
                </h3>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{fullName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{profile.role}</span>
                </div>
              </div>

              {showStats && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Estatísticas
                  </h3>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{credits} créditos disponíveis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Plano: {subscriptionTier}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

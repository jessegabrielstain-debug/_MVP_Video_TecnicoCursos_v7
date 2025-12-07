'use client';

import React, { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Activity, Clock, FileVideo, Settings, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/lib/supabase/database.types';

interface UserActivityLogProps {
  userId: string;
  limit?: number;
  showFilters?: boolean;
}

type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];

export function UserActivityLog({ userId, limit = 20, showFilters = false }: UserActivityLogProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        if (data) {
          setEvents(data);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [userId, limit, supabase]);

  const getIcon = (type: string) => {
    if (type.includes('video') || type.includes('render')) return <FileVideo className="h-4 w-4" />;
    if (type.includes('settings') || type.includes('config')) return <Settings className="h-4 w-4" />;
    if (type.includes('user') || type.includes('profile')) return <User className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Atividades
        </CardTitle>
        <CardDescription>
          Suas últimas ações e eventos no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade registrada recentemente.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="mt-1 bg-muted p-2 rounded-full">
                    {getIcon(event.event_type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {formatEventType(event.event_type)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {JSON.stringify(event.event_data)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ErrorHandlingDemo() {
  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">
          🛡️ Sistema de Tratamento de Erros
        </h1>
        <p className="text-muted-foreground mb-4">
          Demonstração em manutenção.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>O componente de demonstração está sendo atualizado para refletir as últimas mudanças na arquitetura de tratamento de erros.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorHandlingDemo;

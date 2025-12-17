'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: ExportOptions) => Promise<void>
  isExporting: boolean
}

export interface ExportOptions {
  mode: 'draft' | 'production'
  format: 'mp4' | 'webm'
  resolution: '720p' | '1080p'
}

export function ExportDialog({ open, onOpenChange, onExport, isExporting }: ExportDialogProps) {
  const [mode, setMode] = useState<'draft' | 'production'>('draft')
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4')
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p')

  const handleExport = async () => {
    await onExport({ mode, format, resolution })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Vídeo</DialogTitle>
          <DialogDescription>
            Escolha as configurações de renderização para o seu projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Modo de Renderização</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'draft' | 'production')} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="draft" id="draft" className="peer sr-only" />
                <Label
                  htmlFor="draft"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <CheckCircle2 className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">Rascunho (Preview)</div>
                    <div className="text-xs text-muted-foreground mt-1">Grátis • Marca d'água • Rápido</div>
                  </div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="production" id="production" className="peer sr-only" />
                <Label
                  htmlFor="production"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Download className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">Produção</div>
                    <div className="text-xs text-muted-foreground mt-1">Consome Créditos • Alta Qualidade</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === 'production' && (
            <Alert variant="destructive" className="bg-yellow-900/20 border-yellow-600 text-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-200" />
              <AlertTitle>Atenção: Consumo de Créditos</AlertTitle>
              <AlertDescription>
                Esta ação consumirá créditos da sua conta HeyGen. Certifique-se de que o vídeo está finalizado.
              </AlertDescription>
            </Alert>
          )}

          {/* Format & Resolution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <select 
                className="w-full p-2 rounded-md border bg-background"
                value={format}
                onChange={(e) => setFormat(e.target.value as 'mp4' | 'webm')}
              >
                <option value="mp4">MP4 (H.264)</option>
                <option value="webm">WebM</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Resolução</Label>
              <select 
                className="w-full p-2 rounded-md border bg-background"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? 'Iniciando...' : 'Exportar Vídeo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

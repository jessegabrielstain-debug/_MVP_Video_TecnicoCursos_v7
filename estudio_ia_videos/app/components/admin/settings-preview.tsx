'use client'

import { Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemSettingsData } from '@/lib/admin/system-settings'
import Image from 'next/image'

interface SettingsPreviewProps {
  settings: SystemSettingsData
}

export default function SettingsPreview({ settings }: SettingsPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Header Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview do Cabeçalho</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg p-4"
            style={{ 
              backgroundColor: settings.backgroundColor,
              color: settings.textColor,
              fontFamily: settings.fontFamily 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {settings.logoUrl ? (
                  <div className="relative w-10 h-10">
                    <Image
                      src={settings.logoUrl}
                      alt="Logo"
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <Video 
                    className="h-8 w-8" 
                    style={{ color: settings.primaryColor }} 
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold">{settings.companyName}</h1>
                  <p className="text-sm opacity-80">{settings.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{ 
                    backgroundColor: settings.primaryColor,
                    color: '#ffffff'
                  }}
                >
                  Novo Projeto
                </button>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ 
                    backgroundColor: settings.secondaryColor,
                    color: settings.textColor 
                  }}
                >
                  U
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div 
                className="w-full h-16 rounded border border-gray-300 mb-2"
                style={{ backgroundColor: settings.primaryColor }}
              />
              <p className="text-sm font-medium">Primária</p>
              <p className="text-xs text-gray-500">{settings.primaryColor}</p>
            </div>
            <div className="text-center">
              <div 
                className="w-full h-16 rounded border border-gray-300 mb-2"
                style={{ backgroundColor: settings.secondaryColor }}
              />
              <p className="text-sm font-medium">Secundária</p>
              <p className="text-xs text-gray-500">{settings.secondaryColor}</p>
            </div>
            <div className="text-center">
              <div 
                className="w-full h-16 rounded border border-gray-300 mb-2"
                style={{ backgroundColor: settings.backgroundColor }}
              />
              <p className="text-sm font-medium">Fundo</p>
              <p className="text-xs text-gray-500">{settings.backgroundColor}</p>
            </div>
            <div className="text-center">
              <div 
                className="w-full h-16 rounded border border-gray-300 mb-2"
                style={{ backgroundColor: settings.textColor }}
              />
              <p className="text-sm font-medium">Texto</p>
              <p className="text-xs text-gray-500">{settings.textColor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview do Rodapé</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg p-4 text-center"
            style={{ 
              backgroundColor: settings.secondaryColor,
              color: settings.textColor,
              fontFamily: settings.fontFamily
            }}
          >
            <p className="text-sm">
              © 2024 {settings.companyName}. 
              {settings.websiteUrl && (
                <>
                  {' '}
                  <a 
                    href={settings.websiteUrl} 
                    className="underline"
                    style={{ color: settings.primaryColor }}
                  >
                    {settings.websiteUrl}
                  </a>
                </>
              )}
            </p>
            {settings.supportEmail && (
              <p className="text-xs mt-1">
                Suporte: {settings.supportEmail}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Typography Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview da Tipografia</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ fontFamily: settings.fontFamily, color: settings.textColor }}>
            <h1 className="text-3xl font-bold mb-2">Título Principal</h1>
            <h2 className="text-xl font-semibold mb-2">Subtítulo</h2>
            <p className="text-base mb-2">
              Este é um exemplo de texto normal usando a fonte {settings.fontFamily}. 
              O texto deve ser legível e harmonioso com o design geral.
            </p>
            <p className="text-sm text-opacity-80">
              Texto secundário em tamanho menor para informações auxiliares.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

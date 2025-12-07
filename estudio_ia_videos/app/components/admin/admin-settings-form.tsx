// TODO: Alinhar SystemSettingsData com SystemSettings interface
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Download, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { SystemSettingsData } from '@/lib/admin/system-settings'
import LogoUploader from './logo-uploader'
import ColorPicker from './color-picker'
import SettingsPreview from './settings-preview'
import { toast } from 'react-hot-toast'

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Recomendada)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' }
]

interface AdminSettingsFormProps {
  initialSettings?: SystemSettingsData
}

export default function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [settings, setSettings] = useState<SystemSettingsData>(
    initialSettings || {
      primaryColor: "#0066cc",
      secondaryColor: "#f0f0f0",
      backgroundColor: "#ffffff", 
      textColor: "#333333",
      companyName: "Estúdio IA de Vídeos",
      subtitle: "Transforme apresentações em vídeos inteligentes",
      fontFamily: "Inter",
      documentTitle: "Estúdio IA de Vídeos",
      version: "1.0",
      isActive: true
    }
  )

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateSetting = (key: keyof SystemSettingsData, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar configurações')
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      setSuccess(true)
      toast.success('Configurações salvas com sucesso!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/settings/export')
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Configurações exportadas!')
    } catch (error) {
      toast.error('Erro ao exportar configurações')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        setSettings({ ...settings, ...importedSettings })
        toast.success('Configurações importadas!')
      } catch (error) {
        toast.error('Arquivo inválido')
      }
    }
    reader.readAsText(file)
  }

  const resetToDefaults = () => {
    setSettings({
      primaryColor: "#0066cc",
      secondaryColor: "#f0f0f0", 
      backgroundColor: "#ffffff",
      textColor: "#333333",
      companyName: "Estúdio IA de Vídeos",
      subtitle: "Transforme apresentações em vídeos inteligentes",
      fontFamily: "Inter",
      documentTitle: "Estúdio IA de Vídeos",
      version: "1.0",
      isActive: true
    })
    toast.success('Configurações restauradas para o padrão')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-1">Personalize a aparência e configurações gerais</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-settings"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-settings')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={resetToDefaults}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Configurações salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="logo" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="logo">Logo & Marca</TabsTrigger>
              <TabsTrigger value="colors">Cores & Estilo</TabsTrigger>
              <TabsTrigger value="content">Textos</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="logo" className="space-y-6">
              <LogoUploader
                currentLogo={settings.logoUrl}
                onLogoChange={(url) => updateSetting('logoUrl', url)}
                type="logo"
                title="Logo Principal"
              />
              
              <LogoUploader
                currentLogo={settings.faviconUrl}
                onLogoChange={(url) => updateSetting('faviconUrl', url)}
                type="favicon"
                title="Favicon"
                maxSize={512 * 1024} // 512KB for favicon
                acceptedFormats={['image/png', 'image/x-icon', 'image/vnd.microsoft.icon']}
              />
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker
                  label="Cor Primária"
                  color={settings.primaryColor}
                  onChange={(color) => updateSetting('primaryColor', color)}
                />
                
                <ColorPicker
                  label="Cor Secundária"
                  color={settings.secondaryColor}
                  onChange={(color) => updateSetting('secondaryColor', color)}
                />
                
                <ColorPicker
                  label="Cor de Fundo"
                  color={settings.backgroundColor}
                  onChange={(color) => updateSetting('backgroundColor', color)}
                />
                
                <ColorPicker
                  label="Cor do Texto"
                  color={settings.textColor}
                  onChange={(color) => updateSetting('textColor', color)}
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Institucionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => updateSetting('companyName', e.target.value)}
                      placeholder="Estúdio IA de Vídeos"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input
                      id="subtitle"
                      value={settings.subtitle}
                      onChange={(e) => updateSetting('subtitle', e.target.value)}
                      placeholder="Transforme apresentações em vídeos inteligentes"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="websiteUrl">Website</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={settings.websiteUrl || ''}
                      onChange={(e) => updateSetting('websiteUrl', e.target.value)}
                      placeholder="https://empresa.com.br"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail || ''}
                      onChange={(e) => updateSetting('supportEmail', e.target.value)}
                      placeholder="suporte@empresa.com.br"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fontFamily">Família da Fonte</Label>
                    <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="documentTitle">Título do Documento (Tab do Navegador)</Label>
                    <Input
                      id="documentTitle"
                      value={settings.documentTitle}
                      onChange={(e) => updateSetting('documentTitle', e.target.value)}
                      placeholder="Estúdio IA de Vídeos"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="privacyPolicyUrl">URL da Política de Privacidade</Label>
                    <Input
                      id="privacyPolicyUrl"
                      type="url"
                      value={settings.privacyPolicyUrl || ''}
                      onChange={(e) => updateSetting('privacyPolicyUrl', e.target.value)}
                      placeholder="https://empresa.com.br/privacidade"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="termsOfServiceUrl">URL dos Termos de Serviço</Label>
                    <Input
                      id="termsOfServiceUrl"
                      type="url"
                      value={settings.termsOfServiceUrl || ''}
                      onChange={(e) => updateSetting('termsOfServiceUrl', e.target.value)}
                      placeholder="https://empresa.com.br/termos"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <SettingsPreview settings={settings} />
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'

interface LogoUploaderProps {
  currentLogo?: string | null | undefined
  onLogoChange: (logoUrl: string | undefined) => void
  type: 'logo' | 'favicon'
  title: string
  maxSize?: number
  acceptedFormats?: string[]
}

export default function LogoUploader({ 
  currentLogo, 
  onLogoChange, 
  type, 
  title,
  maxSize = 2 * 1024 * 1024, // 2MB default
  acceptedFormats = ['image/png', 'image/svg+xml', 'image/jpeg']
}: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setError(null)
    setIsUploading(true)

    try {
      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. Máximo ${maxSize / (1024 * 1024)}MB`)
      }

      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        throw new Error(`Formato não suportado. Use: ${acceptedFormats.join(', ')}`)
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      // Upload to API
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro no upload')
      }

      const data = await response.json()
      onLogoChange(data.url)
      
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Erro no upload')
    } finally {
      setIsUploading(false)
    }
  }, [maxSize, acceptedFormats, type, onLogoChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: 1,
    multiple: false
  })

  const removeLogo = () => {
    onLogoChange(undefined)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo Preview */}
        {currentLogo && (
          <div className="relative p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Logo Atual</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeLogo}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-32 h-16 bg-white border rounded flex items-center justify-center">
              <Image
                src={currentLogo}
                alt="Logo atual"
                fill
                className="object-contain"
                sizes="128px"
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Enviando...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600">
                    {isDragActive 
                      ? 'Solte o arquivo aqui...' 
                      : 'Clique ou arraste um arquivo aqui'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {acceptedFormats.join(', ').replace(/image\//g, '').toUpperCase()} · Máx {maxSize / (1024 * 1024)}MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Button (Alternative) */}
        <Button
          variant="outline"
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Arquivo
        </Button>
      </CardContent>
    </Card>
  )
}

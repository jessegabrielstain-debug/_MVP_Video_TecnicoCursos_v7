/**
 * 🎨 Hook useUpload
 * Hook React para gerenciar uploads de arquivos
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export interface UploadFile {
  id: string
  name: string
  path: string
  url: string
  size: number
  type: string
  thumbnail?: string
  metadata?: Record<string, unknown>
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (
    file: File,
    options?: {
      projectId?: string
      type?: string
      onProgress?: (progress: UploadProgress) => void
    }
  ): Promise<UploadFile | null> => {
    setUploading(true)
    setError(null)
    setProgress(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options?.projectId) {
        formData.append('projectId', options.projectId)
      }
      
      if (options?.type) {
        formData.append('type', options.type)
      }

      // Simular progresso (XMLHttpRequest para ter controle de progresso)
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise<UploadFile>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progressData = {
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            }
            setProgress(progressData)
            options?.onProgress?.(progressData)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            if (response.success && response.file) {
              resolve(response.file)
            } else {
              reject(new Error(response.error || 'Upload failed'))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })

      const uploadedFile = await uploadPromise
      toast.success('Upload concluído com sucesso!')
      return uploadedFile

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }, [])

  const uploadMultiple = useCallback(async (
    files: File[],
    options?: {
      projectId?: string
      type?: string
      onProgress?: (fileIndex: number, progress: UploadProgress) => void
      onFileComplete?: (fileIndex: number, file: UploadFile) => void
    }
  ): Promise<UploadFile[]> => {
    const uploadedFiles: UploadFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadedFile = await uploadFile(file, {
        ...options,
        onProgress: (progress) => options?.onProgress?.(i, progress),
      })

      if (uploadedFile) {
        uploadedFiles.push(uploadedFile)
        options?.onFileComplete?.(i, uploadedFile)
      }
    }

    return uploadedFiles
  }, [uploadFile])

  return {
    uploadFile,
    uploadMultiple,
    uploading,
    progress,
    error,
  }
}

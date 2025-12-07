/**
 * 🎯 Página de Suporte Offline
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  WifiOff, 
  Wifi,
  Download,
  Upload,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Database,
  File,
  Video,
  Image,
  Music
} from "lucide-react"

interface OfflineItem {
  id: string
  type: 'video' | 'document' | 'image' | 'audio' | 'project'
  name: string
  size: string
  lastSync: Date
  status: 'synced' | 'pending' | 'conflict' | 'offline-only'
  downloadProgress?: number
}

const mockOfflineData: OfflineItem[] = [
  {
    id: '1',
    type: 'video',
    name: 'Tutorial React.mp4',
    size: '125 MB',
    lastSync: new Date(),
    status: 'synced'
  },
  {
    id: '2',
    type: 'project',
    name: 'Apresentação Vendas Q4',
    size: '5.2 MB',
    lastSync: new Date(Date.now() - 3600000),
    status: 'pending'
  },
  {
    id: '3',
    type: 'document',
    name: 'Relatório Mensal.pdf',
    size: '2.8 MB',
    lastSync: new Date(Date.now() - 7200000),
    status: 'conflict'
  },
  {
    id: '4',
    type: 'image',
    name: 'Logo Empresa.png',
    size: '856 KB',
    lastSync: new Date(Date.now() - 86400000),
    status: 'synced'
  },
  {
    id: '5',
    type: 'audio',
    name: 'Narração Curso.mp3',
    size: '45 MB',
    lastSync: new Date(),
    status: 'offline-only',
    downloadProgress: 75
  }
]

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineData, setOfflineData] = useState(mockOfflineData)
  const [storageUsed, setStorageUsed] = useState(68)
  const [totalStorage, setTotalStorage] = useState(100)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  useEffect(() => {
    // Simular mudanças de conectividade
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar status inicial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    setSyncInProgress(true)
    
    // Simular sincronização
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setLastSyncTime(new Date())
    setSyncInProgress(false)
    
    // Atualizar status dos itens
    setOfflineData(prev => prev.map(item => ({
      ...item,
      status: item.status === 'pending' ? 'synced' : item.status,
      lastSync: item.status === 'pending' ? new Date() : item.lastSync
    })))
  }

  const handleDownload = (itemId: string) => {
    setOfflineData(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, downloadProgress: 0 }
        : item
    ))

    // Simular download
    const interval = setInterval(() => {
      setOfflineData(prev => prev.map(item => {
        if (item.id === itemId && item.downloadProgress !== undefined) {
          const newProgress = Math.min((item.downloadProgress || 0) + 10, 100)
          
          if (newProgress === 100) {
            clearInterval(interval)
            return { ...item, status: 'synced', downloadProgress: undefined }
          }
          
          return { ...item, downloadProgress: newProgress }
        }
        return item
      }))
    }, 300)
  }

  const getStatusColor = (status: OfflineItem['status']) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'conflict': return 'bg-red-100 text-red-800'
      case 'offline-only': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: OfflineItem['status']) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-3 h-3" />
      case 'pending': return <Clock className="w-3 h-3" />
      case 'conflict': return <AlertCircle className="w-3 h-3" />
      case 'offline-only': return <HardDrive className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const getTypeIcon = (type: OfflineItem['type']) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'document': return <File className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      case 'project': return <Database className="w-4 h-4" />
      default: return <File className="w-4 h-4" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    if (minutes > 0) return `${minutes}m atrás`
    return 'Agora'
  }

  const pendingItems = offlineData.filter(item => item.status === 'pending').length
  const conflictItems = offlineData.filter(item => item.status === 'conflict').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Modo Offline
              </h1>
              <p className="text-gray-600">
                Gerencie conteúdo offline e sincronização de dados
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge 
                variant={isOnline ? "default" : "secondary"}
                className={`${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              
              <Button 
                onClick={handleSync}
                disabled={!isOnline || syncInProgress}
                variant={pendingItems > 0 ? "default" : "outline"}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                {syncInProgress ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Armazenamento
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {storageUsed}GB / {totalStorage}GB
              </div>
              <Progress value={(storageUsed / totalStorage) * 100} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {((storageUsed / totalStorage) * 100).toFixed(0)}% utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Itens Sincronizados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {offlineData.filter(item => item.status === 'synced').length}
              </div>
              <p className="text-xs text-muted-foreground">
                de {offlineData.length} itens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingItems}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando sync
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conflitos
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {conflictItems}
              </div>
              <p className="text-xs text-muted-foreground">
                requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {!isOnline && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Você está offline. Algumas funcionalidades podem estar limitadas. 
              As alterações serão sincronizadas quando a conexão for restaurada.
            </AlertDescription>
          </Alert>
        )}

        {conflictItems > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {conflictItems} {conflictItems === 1 ? 'item tem' : 'itens têm'} conflitos 
              de sincronização que precisam ser resolvidos.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Itens Offline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Conteúdo Offline</CardTitle>
                <CardDescription>
                  Última sincronização: {formatTime(lastSyncTime)}
                </CardDescription>
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offlineData.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{item.size}</span>
                        <span>•</span>
                        <span>Sync: {formatTime(item.lastSync)}</span>
                      </div>
                      
                      {item.downloadProgress !== undefined && (
                        <div className="mt-2">
                          <Progress value={item.downloadProgress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            Baixando... {item.downloadProgress}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1 capitalize">
                        {item.status === 'synced' && 'Sincronizado'}
                        {item.status === 'pending' && 'Pendente'}
                        {item.status === 'conflict' && 'Conflito'}
                        {item.status === 'offline-only' && 'Offline'}
                      </span>
                    </Badge>
                    
                    {item.status === 'offline-only' && item.downloadProgress === undefined && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(item.id)}
                        disabled={!isOnline}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                    )}
                    
                    {item.status === 'conflict' && (
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Resolver
                      </Button>
                    )}
                    
                    {item.status === 'pending' && isOnline && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={syncInProgress}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Sincronizar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configurações Offline */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configurações de Offline</CardTitle>
            <CardDescription>
              Configure como o conteúdo é armazenado e sincronizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Sincronização Automática</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Sincronizar quando online</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Sincronizar apenas no Wi-Fi</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Sincronização em background</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Armazenamento</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Limpar cache automaticamente</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Compactar dados offline</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Limite de armazenamento:</span>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>50 GB</option>
                      <option>100 GB</option>
                      <option>200 GB</option>
                      <option>Ilimitado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
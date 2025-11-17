/**
 * 🔌 External APIs Component
 * Integration management for TTS providers, media libraries, and compliance services
 */

'use client'

import React, { useState } from 'react'
import { useExternalAPIs } from '@/hooks/use-external-apis'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Mic, 
  Image, 
  Shield, 
  Settings, 
  Play, 
  Download, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  Globe,
  Key,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

const providerIcons = {
  azure: Globe,
  google: Globe,
  openai: Zap,
  elevenlabs: Mic,
  unsplash: Image,
  pexels: Image,
  pixabay: Image,
  shutterstock: Image
}

const statusColors = {
  active: 'text-green-500 bg-green-100',
  inactive: 'text-gray-500 bg-gray-100',
  error: 'text-red-500 bg-red-100',
  warning: 'text-yellow-500 bg-yellow-100'
}

export function ExternalAPIs() {
  const {
    ttsProviders,
    mediaProviders,
    complianceServices,
    usageStats,
    isLoading,
    error,
    generateTTS,
    searchMedia,
    downloadMedia,
    checkCompliance,
    updateProviderConfig,
    testProvider,
    getUsageHistory,
    exportUsageData
  } = useExternalAPIs()

  const [activeTab, setActiveTab] = useState('tts')
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<unknown>(null)
  const [testInput, setTestInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [complianceResults, setComplianceResults] = useState<unknown>(null)

  const handleUpdateConfig = async (providerId: string, config: any) => {
    try {
      await updateProviderConfig(providerId, config)
      setIsConfigDialogOpen(false)
      toast.success('Provider configuration updated')
    } catch (error) {
      toast.error('Failed to update configuration')
    }
  }

  const handleTestProvider = async (providerId: string, testData: any) => {
    try {
      await testProvider(providerId, testData)
      setIsTestDialogOpen(false)
      toast.success('Provider test completed successfully')
    } catch (error) {
      toast.error('Provider test failed')
    }
  }

  const handleGenerateTTS = async (provider: string, text: string, voice: string) => {
    try {
      const result = await generateTTS({ provider, text, voice })
      toast.success('TTS generated successfully')
      return result
    } catch (error) {
      toast.error('Failed to generate TTS')
    }
  }

  const handleSearchMedia = async (provider: string, query: string, type: string) => {
    try {
      const results = await searchMedia({ provider, query, type })
      setSearchResults(results.results || [])
      toast.success(`Found ${results.results?.length || 0} results`)
    } catch (error) {
      toast.error('Failed to search media')
    }
  }

  const handleDownloadMedia = async (provider: string, mediaId: string) => {
    try {
      const result = await downloadMedia({ provider, media_id: mediaId })
      toast.success('Media downloaded successfully')
      return result
    } catch (error) {
      toast.error('Failed to download media')
    }
  }

  const handleCheckCompliance = async (content: any, checks: string[]) => {
    try {
      const result = await checkCompliance({ content, checks })
      setComplianceResults(result)
      toast.success('Compliance check completed')
    } catch (error) {
      toast.error('Failed to check compliance')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProviderStatus = (provider: any) => {
    if (!provider.api_key) return 'inactive'
    if (provider.last_error) return 'error'
    if (provider.rate_limit_exceeded) return 'warning'
    return 'active'
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading external APIs: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">External APIs</h2>
          <p className="text-muted-foreground">
            Manage integrations with TTS providers, media libraries, and compliance services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportUsageData}>
            <Download className="mr-2 h-4 w-4" />
            Export Usage
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.total_calls || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +{usageStats?.calls_today || 0} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(usageStats?.total_cost || 0)}</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(usageStats?.cost_today || 0)} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(usageStats?.success_rate || 0).toFixed(1)}%</div>
            <Progress value={usageStats?.success_rate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.active_providers || 0}</div>
            <div className="text-xs text-muted-foreground">
              of {usageStats?.total_providers || 0} configured
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tts">TTS Providers</TabsTrigger>
          <TabsTrigger value="media">Media Libraries</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* TTS Providers Tab */}
        <TabsContent value="tts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {ttsProviders?.map((provider) => {
              const ProviderIcon = providerIcons[provider.provider_name as keyof typeof providerIcons] || Globe
              const status = getProviderStatus(provider)
              const statusColor = statusColors[status as keyof typeof statusColors]
              
              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ProviderIcon className="h-5 w-5" />
                        <CardTitle className="capitalize">{provider.provider_name}</CardTitle>
                      </div>
                      <Badge className={statusColor}>
                        {status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {provider.description || `${provider.provider_name} TTS service integration`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">API Calls Today</div>
                          <div className="text-muted-foreground">{provider.usage_today || 0}</div>
                        </div>
                        <div>
                          <div className="font-medium">Cost Today</div>
                          <div className="text-muted-foreground">{formatCurrency(provider.cost_today || 0)}</div>
                        </div>
                      </div>
                      
                      {provider.rate_limit && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Rate Limit</span>
                            <span>{provider.usage_today || 0} / {provider.rate_limit}</span>
                          </div>
                          <Progress 
                            value={((provider.usage_today || 0) / provider.rate_limit) * 100} 
                            className="h-2" 
                          />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Play className="mr-2 h-4 w-4" />
                              Test
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Test {provider.provider_name} TTS</DialogTitle>
                              <DialogDescription>
                                Generate a test audio to verify the provider configuration
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="test-text">Text to Speech</Label>
                                <Textarea
                                  id="test-text"
                                  value={testInput}
                                  onChange={(e) => setTestInput(e.target.value)}
                                  placeholder="Enter text to convert to speech..."
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="voice">Voice</Label>
                                <Select defaultValue="default">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Default Voice</SelectItem>
                                    <SelectItem value="male">Male Voice</SelectItem>
                                    <SelectItem value="female">Female Voice</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={() => handleGenerateTTS(provider.provider_name, testInput, 'default')}
                                disabled={!testInput}
                              >
                                Generate TTS
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedProvider(provider)
                            setIsConfigDialogOpen(true)
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                      </div>

                      {provider.last_error && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                          <AlertTriangle className="inline mr-1 h-3 w-3" />
                          {provider.last_error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Media Libraries Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Search</CardTitle>
              <CardDescription>Search and download media from integrated libraries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search for images, videos, or audio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select defaultValue="unsplash">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unsplash">Unsplash</SelectItem>
                      <SelectItem value="pexels">Pexels</SelectItem>
                      <SelectItem value="pixabay">Pixabay</SelectItem>
                      <SelectItem value="shutterstock">Shutterstock</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleSearchMedia('unsplash', searchQuery, 'image')}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults.slice(0, 6).map((result, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium line-clamp-1">{result.title || 'Untitled'}</h4>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{result.author || 'Unknown'}</span>
                              <span>{result.size || 'N/A'}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                <Eye className="mr-1 h-3 w-3" />
                                Preview
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleDownloadMedia('unsplash', result.id)}
                              >
                                <Download className="mr-1 h-3 w-3" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {mediaProviders?.map((provider) => {
              const ProviderIcon = providerIcons[provider.provider_name as keyof typeof providerIcons] || Image
              const status = getProviderStatus(provider)
              const statusColor = statusColors[status as keyof typeof statusColors]
              
              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ProviderIcon className="h-5 w-5" />
                        <CardTitle className="capitalize">{provider.provider_name}</CardTitle>
                      </div>
                      <Badge className={statusColor}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Downloads Today</div>
                          <div className="text-muted-foreground">{provider.downloads_today || 0}</div>
                        </div>
                        <div>
                          <div className="font-medium">Cost Today</div>
                          <div className="text-muted-foreground">{formatCurrency(provider.cost_today || 0)}</div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedProvider(provider)
                          setIsConfigDialogOpen(true)
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Compliance Check</CardTitle>
              <CardDescription>Verify content against accessibility, rating, and copyright standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compliance-content">Content to Check</Label>
                  <Textarea
                    id="compliance-content"
                    placeholder="Enter content text, URL, or upload file..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Compliance Checks</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="accessibility" defaultChecked />
                      <Label htmlFor="accessibility">Accessibility</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="content-rating" defaultChecked />
                      <Label htmlFor="content-rating">Content Rating</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="copyright" defaultChecked />
                      <Label htmlFor="copyright">Copyright</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="privacy" defaultChecked />
                      <Label htmlFor="privacy">Privacy</Label>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleCheckCompliance({}, ['accessibility', 'content_rating', 'copyright', 'privacy'])}>
                  <Shield className="mr-2 h-4 w-4" />
                  Run Compliance Check
                </Button>

                {complianceResults && (
                  <div className="space-y-4 mt-6">
                    <h4 className="font-medium">Compliance Results</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(complianceResults.checks || {}).map(([check, result]: [string, any]) => (
                        <Card key={check}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium capitalize">{check.replace('_', ' ')}</h5>
                              <Badge className={result.passed ? 'bg-green-500' : 'bg-red-500'}>
                                {result.passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Score</span>
                                <span>{result.score}/100</span>
                              </div>
                              <Progress value={result.score} className="h-2" />
                              {result.issues?.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  <div className="font-medium">Issues:</div>
                                  <ul className="list-disc list-inside">
                                    {result.issues.slice(0, 2).map((issue: string, index: number) => (
                                      <li key={index}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Analytics</CardTitle>
              <CardDescription>Detailed usage statistics and cost breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Usage Analytics</h3>
                <p className="mt-2">Detailed usage charts and analytics will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure {selectedProvider?.provider_name}</DialogTitle>
            <DialogDescription>
              Update API keys and configuration settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key..."
                defaultValue={selectedProvider?.api_key}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                placeholder="https://api.example.com"
                defaultValue={selectedProvider?.endpoint_url}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-limit">Rate Limit (per day)</Label>
              <Input
                id="rate-limit"
                type="number"
                placeholder="1000"
                defaultValue={selectedProvider?.rate_limit}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="enabled" 
                defaultChecked={selectedProvider?.enabled}
              />
              <Label htmlFor="enabled">Enable this provider</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateConfig(selectedProvider?.id, {})}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
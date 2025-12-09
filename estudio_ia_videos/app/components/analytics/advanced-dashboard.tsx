
/**
 * 📊 Advanced Analytics Dashboard
 * 
 * Dashboard completo com funil e métricas avançadas
 */

'use client'

import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Activity, Users, Clock } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsData {
  funnel: {
    pptx_uploads: number
    editing_sessions: number
    tts_generations: number
    render_jobs: number
    downloads: number
  }
  avgTimePerStage: {
    upload_to_edit: number
    edit_to_tts: number
    tts_to_render: number
    render_to_download: number
  }
  errorRates: {
    tts: {
      elevenlabs: number
      azure: number
      google: number
    }
    render: number
  }
  queueStats: {
    avgQueueSize: number
    avgWaitTime: number
    peakQueueSize: number
  }
  templateUsage: Record<string, number>
  trends: {
    date: string
    uploads: number
    renders: number
    errors: number
  }[]
  conversionRates: {
    upload_to_edit: number
    edit_to_tts: number
    tts_to_render: number
    render_to_download: number
    overall: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AdvancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  
  useEffect(() => {
    loadAnalytics()
  }, [days])
  
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/analytics/advanced?days=${days}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      logger.error('Failed to load analytics:', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedAnalyticsDashboard' })
    } finally {
      setLoading(false)
    }
  }
  
  const exportData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/v1/analytics/advanced/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, days }),
      })
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${Date.now()}.csv`
        a.click()
      } else {
        const result = await response.json()
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${Date.now()}.json`
        a.click()
      }
    } catch (error) {
      logger.error('Failed to export analytics:', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedAnalyticsDashboard' })
    }
  }
  
  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }
  
  // Prepare funnel data
  const funnelData = [
    { stage: 'Upload', value: data.funnel.pptx_uploads, rate: 100 },
    { stage: 'Edit', value: data.funnel.editing_sessions, rate: data.conversionRates.upload_to_edit },
    { stage: 'TTS', value: data.funnel.tts_generations, rate: data.conversionRates.edit_to_tts },
    { stage: 'Render', value: data.funnel.render_jobs, rate: data.conversionRates.tts_to_render },
    { stage: 'Download', value: data.funnel.downloads, rate: data.conversionRates.render_to_download },
  ]
  
  // Prepare template usage data
  const templateData = Object.entries(data.templateUsage).map(([name, value]) => ({
    name,
    value,
  }))
  
  // Prepare error rates data
  const errorData = [
    { provider: 'ElevenLabs', rate: data.errorRates.tts.elevenlabs * 100 },
    { provider: 'Azure', rate: data.errorRates.tts.azure * 100 },
    { provider: 'Google', rate: data.errorRates.tts.google * 100 },
    { provider: 'Render', rate: data.errorRates.render * 100 },
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDays(7)}>
            7 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDays(30)}>
            30 days
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('json')}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.conversionRates.overall.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Upload → Download
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Queue Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.queueStats.avgQueueSize}</div>
            <p className="text-xs text-muted-foreground">
              Peak: {data.queueStats.peakQueueSize}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.queueStats.avgWaitTime}s</div>
            <p className="text-xs text-muted-foreground">
              Average render queue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.funnel.pptx_uploads}</div>
            <p className="text-xs text-muted-foreground">
              Last {days} days
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            User journey from upload to download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Count" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 flex justify-around">
            {funnelData.map((item, index) => (
              <div key={item.stage} className="text-center">
                <div className="text-2xl font-bold">{item.rate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{item.stage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
          <CardDescription>
            Daily uploads, renders, and errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="uploads" stroke="#8884d8" name="Uploads" />
              <Line type="monotone" dataKey="renders" stroke="#82ca9d" name="Renders" />
              <Line type="monotone" dataKey="errors" stroke="#ff7300" name="Errors" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Template Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Template Usage</CardTitle>
            <CardDescription>
              Most popular templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={templateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {templateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Error Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Error Rates by Provider</CardTitle>
            <CardDescription>
              TTS and render error percentages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={errorData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis dataKey="provider" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="rate" fill="#ff7300" name="Error Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Default export for backwards compatibility
export default AdvancedAnalyticsDashboard

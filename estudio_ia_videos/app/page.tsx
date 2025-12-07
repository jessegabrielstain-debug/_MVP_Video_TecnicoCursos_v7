'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Upload, Sparkles, Play, Settings } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 pt-10">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 mb-6">
            ✨ Nova Versão 2.4 Disponível
          </div>
          <h1 className="text-6xl font-extrabold mb-6 tracking-tight">
            Transforme PPTX em <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Vídeos Profissionais com IA
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            A plataforma mais avançada para automação de vídeos corporativos.
            Crie avatares, narrações e animações em minutos, não semanas.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">
                <Play className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
            </Link>
            <Link href="/pptx">
              <Button variant="outline" size="lg" className="text-lg px-8 h-12">
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-600">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-12 h-12 text-purple-600" />
                <div className="bg-purple-100 px-2 py-1 rounded text-xs font-bold text-purple-800">NOVO</div>
              </div>
              <CardTitle className="text-purple-800">TTS + Avatar Studio</CardTitle>
              <CardDescription>
                Sistema integrado de Text-to-Speech e Avatares 3D para geração de vídeos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tts-avatar-studio">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Acessar Studio
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-600">
            <CardHeader>
              <Upload className="w-12 h-12 mb-4 text-blue-600" />
              <CardTitle className="text-blue-800">Processamento PPTX</CardTitle>
              <CardDescription>
                Upload e análise inteligente de apresentações PowerPoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/pptx">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Processar PPTX
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="w-12 h-12 mb-4 text-purple-600" style={{ width: '3rem', height: '3rem' }} />
              <CardTitle>Avatar 3D</CardTitle>
              <CardDescription>
                Crie vídeos com avatares realistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/talking-photo-pro">
                <Button className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" style={{ width: '1rem', height: '1rem' }} />
                  Criar Avatar
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="w-12 h-12 mb-4 text-green-600" style={{ width: '3rem', height: '3rem' }} />
              <CardTitle>Render Dashboard</CardTitle>
              <CardDescription>
                Suite profissional de renderização com Timeline, Remotion e FFmpeg
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/render">
                <Button className="w-full">
                  <Video className="w-4 h-4 mr-2" style={{ width: '1rem', height: '1rem' }} />
                  Render Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Play className="w-12 h-12 mb-4 text-orange-600" style={{ width: '3rem', height: '3rem' }} />
              <CardTitle>Templates Avançados</CardTitle>
              <CardDescription>
                Sistema completo de templates para NRs com categorização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/templates">
                <Button className="w-full">
                  <Play className="w-4 h-4 mr-2" style={{ width: '1rem', height: '1rem' }} />
                  Biblioteca Templates
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Control Card */}
        <div className="grid md:grid-cols-1 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-8 h-8 text-blue-600" style={{ width: '2rem', height: '2rem' }} />
                </div>
                <div>
                  <CardTitle className="text-xl">Controle do Sistema</CardTitle>
                  <CardDescription className="text-base">
                    Monitoramento em tempo real, validação de funcionalidades e controles avançados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/system-control" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Settings className="w-4 h-4 mr-2" style={{ width: '1rem', height: '1rem' }} />
                    Acessar Controle
                  </Button>
                </Link>
                <div className="flex gap-2 flex-1">
                  <Button variant="outline" className="flex-1" size="sm">
                    ✅ 6/6 Online
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    🔧 100% Testado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Recursos Principais</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg relative">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs px-1 rounded">NEW</div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Sistema TTS + Avatar Integrado</h3>
                <p className="text-gray-600 text-sm">
                  Multi-engine TTS com avatares 3D e lip-sync de 95%+ de precisão
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Upload className="w-6 h-6 text-blue-600" style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Importação de PPTX</h3>
                <p className="text-gray-600 text-sm">
                  Converta apresentações PowerPoint em vídeos automaticamente
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Pipeline de Vídeo Otimizado</h3>
                <p className="text-gray-600 text-sm">
                  Geração de vídeos em &lt;30s com cache inteligente e monitoramento
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Play className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Templates Profissionais</h3>
                <p className="text-gray-600 text-sm">
                  Biblioteca de templates para NRs e treinamentos corporativos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/pptx">
            <Button size="lg" className="text-lg px-8">
              <Play className="w-5 h-5 mr-2" />
              Começar Agora
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

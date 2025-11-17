
'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createBrowserSupabaseClient } from '@/lib/services'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginData.email || !loginData.password) {
      toast.error('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      })

      if (error) {
        toast.error(error.message || 'Credenciais inválidas')
      } else {
        toast.success('Login realizado com sucesso!')
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Erro no login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupData.name || !signupData.email || !signupData.password) {
      toast.error('Preencha todos os campos')
      return
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }

    if (signupData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name
          }
        }
      })

      if (error) {
        toast.error(error.message || 'Erro no cadastro')
      } else {
        toast.success(
          data.session
            ? 'Conta criada com sucesso!'
            : 'Conta criada! Verifique seu email para confirmar.'
        )
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Erro no cadastro')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@estudio-ia.com',
        password: 'demo123'
      })

      if (error) {
        toast.error(error.message || 'Erro no login demo')
      } else {
        toast.success('Bem-vindo à demonstração!')
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Erro no login demo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Bem-vindo ao Estúdio IA</DialogTitle>
          <DialogDescription className="text-center">
            Entre ou crie sua conta para começar a criar vídeos profissionais
          </DialogDescription>
        </DialogHeader>

        {/* Demo Instructions */}
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">🎯 Demo - Use estas credenciais:</p>
              <div className="space-y-1 text-xs">
                <p><strong>Admin:</strong> admin@estudioIA.com / admin123</p>
                <p><strong>Demo:</strong> qualquer@email.com / demo123</p>
                <p><strong>Teste:</strong> teste@teste.com / teste123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Sua senha"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirme sua senha"
                    className="pl-10"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Acessar Demonstração
        </Button>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-700 text-center">
              <strong>Demo:</strong> Use qualquer email + senha "demo123" ou clique em "Acessar Demonstração"
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

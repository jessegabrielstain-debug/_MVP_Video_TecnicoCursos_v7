'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-react'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL ?? 'demo@estudio-ia.com'
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? 'demo123'
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'suporte@estudio-ia.com'

type ActiveTab = 'signin' | 'signup' | 'recovery'

type StatusMessage = {
  type: 'success' | 'error' | 'info'
  message: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordMinLength = 6

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<ActiveTab>('signin')
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [loadingAction, setLoadingAction] = useState<null | ActiveTab | 'demo'>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    remember: true,
    showPassword: false
  })

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  })

  const [recoveryEmail, setRecoveryEmail] = useState('')

  const isLoading = (action: ActiveTab | 'demo') => loadingAction === action

  const translatedStatusIcon = useMemo(() => {
    if (!status) return null
    if (status.type === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />
    if (status.type === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    return <AlertCircle className="h-4 w-4 text-sky-500" />
  }, [status])

  const redirectDestination = useMemo(() => {
    const raw = searchParams?.get('redirect')
    if (!raw) return '/dashboard'
    if (!raw.startsWith('/')) return '/dashboard'
    if (raw.startsWith('/login')) return '/dashboard'
    return raw
  }, [searchParams])

  useEffect(() => {
    const initialMode = searchParams?.get('mode')
    if (initialMode === 'signup' || initialMode === 'recovery' || initialMode === 'signin') {
      setActiveTab(initialMode)
    }

    const reason = searchParams?.get('reason')
    if (reason === 'session_expired') {
      setStatus({
        type: 'info',
        message: 'Sua sessão expirou por segurança. Faça login novamente.'
      })
    } else if (reason === 'unauthorized') {
      setStatus({
        type: 'info',
        message: 'Autenticação necessária para acessar esse recurso.'
      })
    } else if (reason === 'forbidden') {
      setStatus({
        type: 'error',
        message: 'Você não possui permissão para acessar esse recurso.'
      })
    }
  }, [searchParams])

  useEffect(() => {
    const supabase = createClient()

    let cancelled = false

    const loadSession = async () => {
      try {
        const [{ data }, storedEmail] = await Promise.all([
          supabase.auth.getSession(),
          Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem('estudio-ia:last-email') : null)
        ])

        if (cancelled) return

        if (storedEmail) {
          setLoginForm((prev) => ({ ...prev, email: storedEmail }))
          setSignupForm((prev) => ({ ...prev, email: storedEmail }))
          setRecoveryEmail(storedEmail)
        }

        const session = data.session
        if (session?.user) {
          setStatus({
            type: 'info',
            message: 'Você já está autenticado. Redirecionando para o painel...'
          })
          const target = redirectDestination || '/dashboard'
          router.replace(target)
          router.refresh()
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão', error)
      } finally {
        if (!cancelled) {
          setBootstrapping(false)
        }
      }
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [redirectDestination, router])

  const translateSupabaseError = (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Ocorreu um erro inesperado. Tente novamente.'

    if (/Invalid login credentials/i.test(message)) {
      return 'Email ou senha incorretos. Confira as credenciais e tente novamente.'
    }

    if (/Email not confirmed/i.test(message)) {
      return 'Confirme seu email antes de acessar. Verifique sua caixa de entrada.'
    }

    if (/User already registered/i.test(message)) {
      return 'Este email já está cadastrado. Faça login ou use a opção de recuperar acesso.'
    }

    if (/Password should be at least/i.test(message)) {
      return `A senha precisa ter pelo menos ${passwordMinLength} caracteres.`
    }

    return message
  }

  const persistLastEmail = (email: string, remember: boolean) => {
    if (typeof window === 'undefined') return
    if (remember) {
      window.localStorage.setItem('estudio-ia:last-email', email)
    } else {
      window.localStorage.removeItem('estudio-ia:last-email')
    }
  }

  const handleSignin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    const email = loginForm.email.trim().toLowerCase()
    const password = loginForm.password.trim()

    if (!emailRegex.test(email)) {
      setStatus({ type: 'error', message: 'Informe um email válido.' })
      return
    }

    if (password.length < passwordMinLength) {
      setStatus({
        type: 'error',
        message: `A senha deve ter pelo menos ${passwordMinLength} caracteres.`
      })
      return
    }

    setLoadingAction('signin')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        throw error
      }

      persistLastEmail(email, loginForm.remember)

      setStatus({
        type: 'success',
        message: 'Login realizado com sucesso. Você será redirecionado em instantes.'
      })

      const target = redirectDestination || '/dashboard'
      router.replace(target)
      router.refresh()
    } catch (error) {
      setStatus({ type: 'error', message: translateSupabaseError(error) })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    const name = signupForm.name.trim()
    const email = signupForm.email.trim().toLowerCase()
    const password = signupForm.password.trim()
    const confirmPassword = signupForm.confirmPassword.trim()

    if (name.length < 3) {
      setStatus({
        type: 'error',
        message: 'Informe seu nome completo (mínimo de 3 caracteres).'
      })
      return
    }

    if (!emailRegex.test(email)) {
      setStatus({ type: 'error', message: 'Informe um email válido.' })
      return
    }

    if (password.length < passwordMinLength) {
      setStatus({
        type: 'error',
        message: `Defina uma senha com pelo menos ${passwordMinLength} caracteres.`
      })
      return
    }

    if (password !== confirmPassword) {
      setStatus({
        type: 'error',
        message: 'As senhas informadas não conferem.'
      })
      return
    }

    setLoadingAction('signup')

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })

      if (error) {
        throw error
      }

      persistLastEmail(email, true)

      setStatus({
        type: 'success',
        message:
          data.session
            ? 'Conta criada e login realizado automaticamente. Redirecionando...'
            : 'Conta criada! Enviamos um email para confirmação. Após confirmar, faça login.'
      })

      if (data.session) {
        const target = redirectDestination || '/dashboard'
        router.replace(target)
        router.refresh()
      } else {
        setActiveTab('signin')
        setLoginForm((prev) => ({ ...prev, email }))
      }
    } catch (error) {
      setStatus({ type: 'error', message: translateSupabaseError(error) })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    const email = recoveryEmail.trim().toLowerCase()

    if (!emailRegex.test(email)) {
      setStatus({ type: 'error', message: 'Informe um email válido para recuperar acesso.' })
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    setLoadingAction('recovery')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }

      setStatus({
        type: 'success',
        message: 'Enviamos um email com o link para redefinir sua senha.'
      })

      setActiveTab('signin')
    } catch (error) {
      setStatus({ type: 'error', message: translateSupabaseError(error) })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDemoLogin = async () => {
    setStatus(null)
    setLoadingAction('demo')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
      })

      if (error) {
        throw error
      }

      persistLastEmail(DEMO_EMAIL, false)

      setStatus({
        type: 'success',
        message: 'Acesso demo liberado. Redirecionando para o dashboard.'
      })

      const target = redirectDestination || '/dashboard'
      router.replace(target)
      router.refresh()
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          'Não foi possível entrar no modo demonstração. Verifique as credenciais demo ou tente novamente mais tarde.'
      })
      console.error('Erro no login demo', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const renderLeftPanel = () => (
    <Card className="hidden w-full max-w-md flex-1 flex-col justify-between border-none bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-8 text-white shadow-xl md:flex">
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-wide text-violet-200">
          <ShieldCheck className="h-5 w-5 text-violet-200" />
          Plataforma segura com Supabase Auth
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight">
            Estúdio IA Vídeos
          </h1>
          <p className="text-sm text-violet-100/80">
            O ambiente completo para criar, gerenciar e publicar vídeos educacionais com recursos avançados de IA generativa.
          </p>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
            <Rocket className="mt-0.5 h-5 w-5 text-violet-200" />
            <div>
              <p className="font-semibold text-white">Fluxo pronto para produção</p>
              <p className="text-violet-100/80">
                Upload de PPTX, timeline colaborativa, renderização distribuída e publicação integrada.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
            <Sparkles className="mt-0.5 h-5 w-5 text-violet-200" />
            <div>
              <p className="font-semibold text-white">Assistentes inteligentes</p>
              <p className="text-violet-100/80">
                Sugestões automáticas de roteiros, ajustes de voz e personalização visual com IA proprietária.
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-violet-100/70">
        Dúvidas ou acesso corporativo? Fale com nossa equipe em{' '}
        <span className="font-medium text-white">{SUPPORT_EMAIL}</span>.
      </p>
    </Card>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:flex-row">
        {renderLeftPanel()}

        <Card className="flex-1 border border-white/10 bg-slate-950/70 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-white">Acesse sua conta</CardTitle>
              <CardDescription className="text-slate-300">
                Autenticação segura com Supabase. Utilize suas credenciais ou crie uma nova conta em segundos.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {status ? (
              <Alert
                variant={status.type === 'error' ? 'destructive' : 'default'}
                className={cn(
                  'border',
                  status.type === 'error'
                    ? 'border-red-500/60 bg-red-500/10 text-red-100'
                    : status.type === 'success'
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                      : 'border-sky-500/60 bg-sky-500/10 text-sky-100'
                )}
              >
                {translatedStatusIcon}
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            ) : null}

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setStatus(null)
                setActiveTab(value as ActiveTab)
              }}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-3 border border-white/10 bg-slate-900 text-slate-200">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                  Criar conta
                </TabsTrigger>
                <TabsTrigger value="recovery" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                  Recuperar acesso
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-200">Email profissional</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="nome@empresa.com"
                        autoComplete="email"
                        className="bg-slate-900/70 pl-10 text-slate-100 placeholder:text-slate-500"
                        value={loginForm.email}
                        onChange={(event) => {
                          const value = event.target.value
                          setLoginForm((prev) => ({ ...prev, email: value }))
                        }}
                        disabled={isLoading('signin') || bootstrapping}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-200">Senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="signin-password"
                        type={loginForm.showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        autoComplete="current-password"
                        className="bg-slate-900/70 pl-10 pr-10 text-slate-100 placeholder:text-slate-500"
                        value={loginForm.password}
                        onChange={(event) => {
                          const value = event.target.value
                          setLoginForm((prev) => ({ ...prev, password: value }))
                        }}
                        disabled={isLoading('signin') || bootstrapping}
                        required
                        minLength={passwordMinLength}
                      />
                      <button
                        type="button"
                        onClick={() => setLoginForm((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                        aria-label={loginForm.showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {loginForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <Checkbox
                        checked={loginForm.remember}
                        onCheckedChange={(checked) =>
                          setLoginForm((prev) => ({ ...prev, remember: Boolean(checked) }))
                        }
                        className="border-slate-500 bg-slate-900 data-[state=checked]:border-violet-500 data-[state=checked]:bg-violet-600"
                      />
                      Manter sessão ativa neste dispositivo
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('recovery')}
                      className="text-xs font-medium text-violet-300 hover:text-violet-100"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-violet-600 text-white hover:bg-violet-500"
                    disabled={isLoading('signin') || bootstrapping}
                  >
                    {isLoading('signin') ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validando credenciais...
                      </span>
                    ) : (
                      'Entrar no painel'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="signup-name" className="text-slate-200">Nome completo</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Como deseja ser identificado?"
                          autoComplete="name"
                          className="bg-slate-900/70 pl-10 text-slate-100 placeholder:text-slate-500"
                          value={signupForm.name}
                          onChange={(event) => setSignupForm((prev) => ({ ...prev, name: event.target.value }))}
                          disabled={isLoading('signup')}
                          required
                          minLength={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="signup-email" className="text-slate-200">Email corporativo</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="nome@empresa.com"
                          autoComplete="email"
                          className="bg-slate-900/70 pl-10 text-slate-100 placeholder:text-slate-500"
                          value={signupForm.email}
                          onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))}
                          disabled={isLoading('signup')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-200">Senha</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="signup-password"
                          type={signupForm.showPassword ? 'text' : 'password'}
                          placeholder="Crie uma senha forte"
                          autoComplete="new-password"
                          className="bg-slate-900/70 pl-10 pr-10 text-slate-100 placeholder:text-slate-500"
                          value={signupForm.password}
                          onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                          disabled={isLoading('signup')}
                          required
                          minLength={passwordMinLength}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSignupForm((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                          }
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                          aria-label={signupForm.showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {signupForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-slate-200">Confirmar senha</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="signup-confirm-password"
                          type={signupForm.showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repita a senha"
                          autoComplete="new-password"
                          className="bg-slate-900/70 pl-10 pr-10 text-slate-100 placeholder:text-slate-500"
                          value={signupForm.confirmPassword}
                          onChange={(event) =>
                            setSignupForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                          }
                          disabled={isLoading('signup')}
                          required
                          minLength={passwordMinLength}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSignupForm((prev) => ({
                              ...prev,
                              showConfirmPassword: !prev.showConfirmPassword
                            }))
                          }
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                          aria-label={signupForm.showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {signupForm.showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Ao continuar você concorda com os termos de uso e com o tratamento dos seus dados de acordo com a LGPD.
                  </p>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
                    disabled={isLoading('signup')}
                  >
                    {isLoading('signup') ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Criando conta segura...
                      </span>
                    ) : (
                      'Criar conta gratuita'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="recovery">
                <form onSubmit={handleRecovery} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email" className="text-slate-200">Email cadastrado</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="nome@empresa.com"
                        autoComplete="email"
                        className="bg-slate-900/70 pl-10 text-slate-100 placeholder:text-slate-500"
                        value={recoveryEmail}
                        onChange={(event) => setRecoveryEmail(event.target.value)}
                        disabled={isLoading('recovery')}
                        required
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Enviaremos um email com o link de redefinição. Caso não encontre, verifique sua caixa de spam ou entre em contato pelo suporte.
                  </p>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full bg-sky-600 text-white hover:bg-sky-500"
                      disabled={isLoading('recovery')}
                    >
                      {isLoading('recovery') ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando instruções...
                        </span>
                      ) : (
                        'Enviar link de recuperação'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-slate-300 hover:text-white"
                      onClick={() => setActiveTab('signin')}
                    >
                      Voltar para o login
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="space-y-3 rounded-lg border border-dashed border-violet-500/40 bg-violet-500/5 p-4 text-center text-sm text-slate-200">
              <p className="font-medium text-violet-100">Quer testar rapidamente?</p>
              <p className="text-xs text-slate-300">
                Use as credenciais demo para explorar o painel completo sem criar conta.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span>
                  Email demo:{' '}
                  <code className="rounded bg-slate-900 px-2 py-1 text-violet-200">{DEMO_EMAIL}</code>
                </span>
                <span>
                  Senha:{' '}
                  <code className="rounded bg-slate-900 px-2 py-1 text-violet-200">{DEMO_PASSWORD}</code>
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full border border-violet-500/80 bg-violet-600/20 text-violet-100 hover:bg-violet-600/30"
                onClick={handleDemoLogin}
                disabled={isLoading('demo')}
              >
                {isLoading('demo') ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando na demonstração...
                  </span>
                ) : (
                  'Acessar demonstração agora'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

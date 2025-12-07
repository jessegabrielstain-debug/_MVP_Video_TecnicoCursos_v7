import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Sparkles, Video, ShieldCheck, Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Login | Estúdio IA de Vídeos',
    description: 'Acesse sua conta para criar vídeos profissionais com IA',
};

// Loading fallback for the login form
function LoginFormFallback() {
    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
                <p className="text-muted-foreground">Entre com suas credenciais para acessar o estúdio</p>
            </div>
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left Column - Branding & Testimonial */}
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-zinc-900 opacity-90" />

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Video className="mr-2 h-6 w-6" />
                    Estúdio IA de Vídeos
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Esta plataforma revolucionou a forma como criamos treinamentos de segurança.
                            A geração automática a partir de PPTX economiza semanas de trabalho.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-300">Dev Team - MVP v2.4</footer>
                    </blockquote>
                </div>

                {/* Feature Highlights */}
                <div className="relative z-20 mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-10">
                    <div className="space-y-2">
                        <div className="flex items-center text-blue-300">
                            <Sparkles className="mr-2 h-4 w-4" />
                            <span className="text-sm font-medium">IA Generativa</span>
                        </div>
                        <p className="text-xs text-zinc-400">Avatares e Vozes realistas</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center text-purple-300">
                            <Video className="mr-2 h-4 w-4" />
                            <span className="text-sm font-medium">Render Rápido</span>
                        </div>
                        <p className="text-xs text-zinc-400">Pipeline FFmpeg otimizado</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center text-green-300">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span className="text-sm font-medium">Seguro</span>
                        </div>
                        <p className="text-xs text-zinc-400">RBAC e RLS integrados</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Suspense fallback={<LoginFormFallback />}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

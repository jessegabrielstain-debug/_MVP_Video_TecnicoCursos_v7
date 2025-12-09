'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, AlertCircle, Shield, User, Eye } from 'lucide-react';
import { logger } from '@/lib/logger';

import { getBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Credenciais de teste - só visíveis em desenvolvimento
const DEV_CREDENTIALS = {
    admin: { email: 'admin@mvpvideo.test', password: 'senha123', label: 'Admin', icon: Shield },
    editor: { email: 'editor@mvpvideo.test', password: 'senha123', label: 'Editor', icon: User },
    viewer: { email: 'viewer@mvpvideo.test', password: 'senha123', label: 'Viewer', icon: Eye },
} as const;

const formSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getBrowserClient();

    const [isLoading, setIsLoading] = React.useState(false);
    const [loadingRole, setLoadingRole] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    
    // Mostrar botões de dev apenas em desenvolvimento
    const isDev = process.env.NODE_ENV === 'development';

    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    const reason = searchParams.get('reason');

    React.useEffect(() => {
        if (reason === 'unauthorized') {
            setError('Sessão expirada ou inválida. Por favor, faça login novamente.');
        }
    }, [reason]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // Login rápido para desenvolvimento
    async function quickLogin(role: keyof typeof DEV_CREDENTIALS) {
        setLoadingRole(role);
        setError(null);

        try {
            const creds = DEV_CREDENTIALS[role];
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: creds.email,
                password: creds.password,
            });

            if (signInError) {
                throw signInError;
            }

            router.push(redirectUrl);
            router.refresh();
        } catch (err) {
            logger.error('Quick login error', err instanceof Error ? err : new Error(String(err)), { component: 'LoginForm', role });
            setError(`Falha no login ${role}. Verifique se os usuários de teste foram criados.`);
        } finally {
            setLoadingRole(null);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (signInError) {
                throw signInError;
            }

            router.push(redirectUrl);
            router.refresh();
        } catch (err) {
            logger.error('Login error', err instanceof Error ? err : new Error(String(err)), { component: 'LoginForm' });
            setError('Email ou senha incorretos. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
                <p className="text-muted-foreground">Entre com suas credenciais para acessar o estúdio</p>
            </div>

            <Card className="border-muted/50 shadow-lg">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                        Acesse sua conta para gerenciar vídeos e templates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="seu@email.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Button variant="link" className="px-0 font-normal h-auto text-xs" type="button">
                                    Esqueceu a senha?
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                disabled={isLoading}
                                {...form.register('password')}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4">
                    <p className="text-xs text-muted-foreground text-center">
                        Protegido por autenticação segura Supabase. <br />
                        Ao entrar, você concorda com nossos termos de serviço.
                    </p>
                </CardFooter>
            </Card>

            {/* Botões de Login Rápido - Apenas Desenvolvimento */}
            {isDev && (
                <Card className="border-dashed border-yellow-500/50 bg-yellow-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="h-4 w-4" />
                            Login Rápido (Dev Only)
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Clique para logar instantaneamente como um usuário de teste
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(DEV_CREDENTIALS) as Array<keyof typeof DEV_CREDENTIALS>).map((role) => {
                                const cred = DEV_CREDENTIALS[role];
                                const Icon = cred.icon;
                                const isRoleLoading = loadingRole === role;
                                return (
                                    <Button
                                        key={role}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => quickLogin(role)}
                                        disabled={!!loadingRole || isLoading}
                                        className={`flex-col h-auto py-3 ${
                                            role === 'admin' 
                                                ? 'border-red-500/50 hover:bg-red-500/10 hover:border-red-500' 
                                                : role === 'editor'
                                                ? 'border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500'
                                                : 'border-green-500/50 hover:bg-green-500/10 hover:border-green-500'
                                        }`}
                                    >
                                        {isRoleLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Icon className={`h-4 w-4 ${
                                                role === 'admin' ? 'text-red-500' : 
                                                role === 'editor' ? 'text-blue-500' : 'text-green-500'
                                            }`} />
                                        )}
                                        <span className="text-xs mt-1">{cred.label}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

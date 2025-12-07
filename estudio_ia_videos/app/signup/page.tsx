'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, AlertCircle, Video } from 'lucide-react';
import Link from 'next/link';

import { getBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
    name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
    confirmPassword: z.string().min(6, { message: 'Confirme a senha' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export default function SignupPage() {
    const router = useRouter();
    const supabase = getBrowserClient();

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);

        try {
            const { error: signUpError, data } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.name,
                    },
                },
            });

            if (signUpError) {
                throw signUpError;
            }

            // Check if email confirmation is required
            if (data?.user && !data.session) {
                setSuccess(true);
                setError('Verifique seu email para confirmar o cadastro.');
            } else {
                // Auto-login successful
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            console.error('Signup error:', err);
            const message = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <Card className="w-full max-w-md border-muted/50 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full w-fit">
                            <AlertCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Conta Criada!</CardTitle>
                        <CardDescription>
                            Verifique seu email para confirmar o cadastro e fazer login.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button asChild>
                            <Link href="/login">Ir para Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Video className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Estúdio IA</h1>
                    </div>
                    <h2 className="text-2xl font-bold">Criar Conta</h2>
                    <p className="text-muted-foreground">Comece a criar vídeos incríveis com IA</p>
                </div>

                <Card className="border-muted/50 shadow-lg">
                    <CardHeader>
                        <CardTitle>Cadastro</CardTitle>
                        <CardDescription>
                            Preencha os dados abaixo para criar sua conta
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
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    placeholder="Seu nome"
                                    type="text"
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    disabled={isLoading}
                                    {...form.register('name')}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                )}
                            </div>

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
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                    {...form.register('password')}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                    {...form.register('confirmPassword')}
                                />
                                {form.formState.errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300" type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Conta
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t p-4">
                        <p className="text-sm text-center text-muted-foreground">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Fazer Login
                            </Link>
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                            Ao criar uma conta, você concorda com nossos termos de serviço.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

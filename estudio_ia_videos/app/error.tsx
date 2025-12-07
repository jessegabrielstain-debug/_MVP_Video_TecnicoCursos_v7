
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20">
                <AlertTriangle className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight">Algo deu errado!</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
                Encontramos um erro inesperado. Nossa equipe já foi notificada.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.href = '/'} variant="outline">
                    Voltar ao Início
                </Button>
                <Button onClick={() => reset()}>
                    Tentar Novamente
                </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-slate-950 p-4 text-left text-xs text-slate-50">
                    <p className="mb-2 font-mono font-bold text-red-400">{error.name}: {error.message}</p>
                    <pre className="font-mono text-slate-400">{error.stack}</pre>
                </div>
            )}
        </div>
    )
}

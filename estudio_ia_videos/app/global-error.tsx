'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import './globals.css' // Import globals to ensure styling works if possible, though html/body are reset here

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global Error:', error)
    }, [error])

    return (
        <html lang="pt-BR">
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center text-foreground">
                    <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold tracking-tight">Erro Crítico do Sistema</h2>
                    <p className="mb-6 max-w-md text-muted-foreground">
                        Ocorreu um erro irrecuperável na aplicação.
                    </p>
                    <Button onClick={() => reset()}>
                        Recarregar Aplicação
                    </Button>
                </div>
            </body>
        </html>
    )
}

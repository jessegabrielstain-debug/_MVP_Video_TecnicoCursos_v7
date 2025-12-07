import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                    <FileQuestion className="h-10 w-10 text-muted-foreground" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    404 - Página não encontrada
                </h1>
                <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                    Desculpe, não conseguimos encontrar a página que você está procurando.
                    Ela pode ter sido movida ou excluída.
                </p>
                <div className="flex gap-4">
                    <Button asChild variant="default">
                        <Link href="/dashboard">Voltar ao Dashboard</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/">Ir para Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

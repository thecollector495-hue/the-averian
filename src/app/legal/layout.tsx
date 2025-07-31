
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
        <header className="p-4 border-b">
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to App
                </Link>
            </Button>
        </header>
        <main className="container mx-auto py-8">
            <div className="prose dark:prose-invert max-w-4xl">
                 {children}
            </div>
        </main>
    </div>
  );
}


import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from '@/components/bottom-navigation';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ItemsProvider } from '@/context/ItemsContext';
import { ThemeProvider } from '@/context/ThemeProvider';

export const metadata: Metadata = {
  title: 'The Avarian',
  description: 'Your modern aviary management solution.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          <ItemsProvider>
            <CurrencyProvider>
              <div className="relative flex min-h-screen flex-col bg-background">
                <main className="flex-1 pb-16">{children}</main>
                <BottomNavigation />
              </div>
              <Toaster />
            </CurrencyProvider>
          </ItemsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

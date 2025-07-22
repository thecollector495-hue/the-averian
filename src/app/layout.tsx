
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from '@/components/bottom-navigation';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ItemsProvider } from '@/context/ItemsContext';
import { ThemeProvider } from '@/context/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { AppContent } from '@/components/app-content';

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
          <AuthProvider>
            <ItemsProvider>
              <CurrencyProvider>
                <AppContent>
                  {children}
                </AppContent>
                <Toaster />
              </CurrencyProvider>
            </ItemsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

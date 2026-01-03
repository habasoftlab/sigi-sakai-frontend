'use client';
import { LayoutProvider } from '../layout/context/layoutcontext';
import AuthGuard from '../layout/context/AuthGuard';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-blue/theme.css`} rel="stylesheet"></link>
            </head>
            <body>
                <PrimeReactProvider>
                    <LayoutProvider>
                        <AuthGuard>
                            {children}
                        </AuthGuard>
                    </LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from '@/components/providers/NextAuthProvider';

export const metadata: Metadata = {
  title: 'LaSalle Gestiona Portal',
  description: 'Gestión automatizada de préstamos y adeudos de material de cocina en el Laboratorio de Gastronomía de Universidad La Salle',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
      <NextAuthProvider>
          {children}
          <Toaster />
          </NextAuthProvider>
      </body>
    </html>
  );
}

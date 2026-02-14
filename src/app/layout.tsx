'use client';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
// @ts-ignore
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <HeroUIProvider className=''>
          <ToastProvider />
          <div className='min-h-screen bg-background text-foreground px-2'>{children}</div>
        </HeroUIProvider>
      </body>
    </html>
  );
}

'use client';
import { HeroUIProvider } from '@heroui/react';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='zh' className='dark'>
      <body>
        <HeroUIProvider>
          <div className='min-h-screen bg-background text-foreground p-4 md:p-8'>{children}</div>
        </HeroUIProvider>
      </body>
    </html>
  );
}

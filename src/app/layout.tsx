'use client';
import { Providers } from '@/components/Providers';
import SidebarWrapper from '@/components/SidebarWrapper';
// @ts-ignore
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='antialiased font-sans'>
        <Providers>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Providers>
      </body>
    </html>
  );
}

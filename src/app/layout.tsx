import { Providers } from '@/components/Providers';
import SidebarWrapper from '@/components/SidebarWrapper';
// @ts-ignore
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>Cluster Manager</title>
      </head>
      <body className='antialiased font-sans'>
        <Providers>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Providers>
      </body>
    </html>
  );
}

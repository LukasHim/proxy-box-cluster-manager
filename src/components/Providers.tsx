'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/translations/i18n';
import { useEffect, useState } from 'react';
import DynamicTitle from './DynamicTitle';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <HeroUIProvider>
        <ConfigProvider>
          <div className='opacity-0'>{children}</div>
        </ConfigProvider>
      </HeroUIProvider>
    );
  }

  return (
    <HeroUIProvider>
      <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
        <ConfigProvider>
          <I18nextProvider i18n={i18n}>
            <ToastProvider />
            <DynamicTitle />
            {children}
          </I18nextProvider>
        </ConfigProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

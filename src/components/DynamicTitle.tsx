'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function DynamicTitle() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();

  useEffect(() => {

    console.log(document.title);
    
    const brand = t('Brand');
    let pageName = '';

    switch (pathname) {
      case '/':
        pageName = t('Dashboard');
        break;
      case '/config':
        pageName = t('Config');
        break;
      case '/debug':
        pageName = t('Debug');
        break;
      case '/settings':
        pageName = t('Settings');
        break;
      default:
        // Handle nested routes if any
        if (pathname.startsWith('/config/')) pageName = t('Config');
        else if (pathname.startsWith('/debug/')) pageName = t('Debug');
        else if (pathname.startsWith('/settings/')) pageName = t('Settings');
    }

    document.title = pageName ? `${pageName} - ${brand}` : brand;
  }, [pathname, t, i18n.language]);

  return null;
}

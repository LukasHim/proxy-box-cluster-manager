'use client';

import { Menu, Server } from 'lucide-react';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  return (
    <header className='h-14 border-b border-divider bg-background/70 backdrop-blur-md flex items-center px-4 sticky top-0 z-40 w-full'>
      <Button isIconOnly variant='light' className='md:hidden mr-2' onPress={onMenuClick}>
        <Menu size={20} />
      </Button>

      <div className='flex items-center gap-2'>
        <Server className='text-blue-500' size={20} />
        <span className='font-bold text-blue-500'>{t('Brand')}</span>
      </div>

      <div className='flex-1' />

      {/* Add global actions or user info here if needed */}
    </header>
  );
}

'use client';

import { LayoutDashboard, Settings, FileJson, Bug, Server, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuItems = [
    { name: t('Dashboard'), icon: <LayoutDashboard size={20} />, href: '/' },
    { name: t('Config'), icon: <FileJson size={20} />, href: '/config' },
    { name: t('Debug'), icon: <Bug size={20} />, href: '/debug' },
    { name: t('Settings'), icon: <Settings size={20} />, href: '/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className='fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200' onClick={onClose} />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 w-64 bg-background border-r border-divider z-50
        transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className='p-6'></div>

        <nav className='flex-1 px-4 space-y-2 mt-4'>
          {menuItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className='block' onClick={onClose}>
                <Button
                  variant={isActive ? 'flat' : 'light'}
                  color={isActive ? 'primary' : 'default'}
                  className={`w-full justify-start ${isActive ? 'font-semibold' : ''}`}
                  startContent={item.icon}>
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

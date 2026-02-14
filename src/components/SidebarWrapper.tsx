'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className='flex min-h-screen bg-background text-foreground w-full'>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className='flex-1 flex flex-col min-w-0 h-screen overflow-hidden'>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className='flex-1 overflow-y-auto p-4 md:p-8 outline-none'>{children}</main>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { Header } from './Header';
import { Navigation, MobileTabBar } from './Navigation';
import { ImgIpiStrip } from './ImgIpiStrip';
import { AskAI } from '@/components/ai/AskAI';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-[100dvh]">
      <Header />
      <Navigation />
      <ImgIpiStrip />
      <main className="mx-auto max-w-[1400px] px-3 pb-32 pt-5 md:px-4 lg:pb-16">
        {children}
      </main>
      <MobileTabBar />
      <AskAI />
    </div>
  );
}

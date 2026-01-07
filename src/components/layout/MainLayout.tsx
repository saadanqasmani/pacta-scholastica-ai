import { ReactNode } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { AskAI } from '@/components/ai/AskAI';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container py-6">
        {children}
      </main>
      <AskAI />
    </div>
  );
}

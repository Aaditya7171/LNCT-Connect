
import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar />
      <Navbar />

      <main className="pt-20 md:pt-4 pb-4 px-4 md:pl-72 lg:pl-72 md:pr-8 max-w-[1200px] mx-auto flex-grow w-full">
        {children}
      </main>

      <footer className="py-4 px-4 md:pl-72 lg:pl-72 border-t border-border text-center md:text-left text-sm text-muted-foreground">
        <div className="max-w-[1200px] mx-auto">
          LNCT Connect - Copyright © 2025. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

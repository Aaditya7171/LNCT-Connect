
import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <Navbar />
      
      <main className="pt-20 md:pt-4 pb-4 px-4 md:pl-72 lg:pl-72 md:pr-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

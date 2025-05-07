
import React, { useEffect } from 'react';
import { EventFeed } from '@/components/home/EventFeed';
import { AlumniFeed } from '@/components/home/AlumniFeed';
import { FeedbackForm } from '@/components/home/FeedbackForm';
import { ForumPostsSection } from '@/components/home/ForumPostsSection';
import { AlertsSection } from '@/components/home/AlertsSection';

const Index = () => {
  // Add a class to the body for gradient background
  useEffect(() => {
    document.body.classList.add('home-gradient-bg');

    return () => {
      document.body.classList.remove('home-gradient-bg');
    };
  }, []);

  return (
    <div className="page-transition">
      <div className="py-6">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LNCT Connect
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect, Collaborate, Execute: Powering LNCT's Vision
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8 animate-slide-in-left">
            <div className="glass-card p-6 rounded-xl shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
              <ForumPostsSection />
            </div>
            <div className="glass-card p-6 rounded-xl shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
              <EventFeed />
            </div>
            <div className="glass-card p-6 rounded-xl shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
              <FeedbackForm />
            </div>
          </div>

          <div className="space-y-8 animate-slide-in-right">
            <div className="glass-card p-6 rounded-xl shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
              <AlertsSection />
            </div>
            <div className="glass-card p-6 rounded-xl shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
              <AlumniFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

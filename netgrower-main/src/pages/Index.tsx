
import React from 'react';
import { EventFeed } from '@/components/home/EventFeed';
import { AlumniFeed } from '@/components/home/AlumniFeed';
import { FeedbackForm } from '@/components/home/FeedbackForm';

const Index = () => {
  return (
    <div className="page-transition">
      <div className="py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">LNCT Connect</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Connect, Collaborate, Execute: Powering LNCT's Vision
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <EventFeed />
            <FeedbackForm />
          </div>
          <AlumniFeed />
        </div>
      </div>
    </div>
  );
};

export default Index;

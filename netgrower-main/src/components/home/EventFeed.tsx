
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { PostCard, PostCardProps } from '@/components/common/PostCard';

// Mock data for events
const EVENTS_DATA: Omit<PostCardProps, 'className'>[] = [
  {
    id: 'event-1',
    author: {
      name: 'LNCT Events',
      avatar: '',
      role: 'faculty'
    },
    content: '🎓 Upcoming Graduation Ceremony for the class of 2023! Join us to celebrate this milestone achievement. Date: May 15, 2023. Venue: LNCT Campus Auditorium.',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    timestamp: '2 days ago',
    likes: 145,
    comments: 32,
    isLiked: false
  },
  {
    id: 'event-2',
    author: {
      name: 'Tech Festival Committee',
      avatar: '',
      role: 'student'
    },
    content: '💻 TechFest 2023 is here! Register for hackathons, coding competitions, and workshops. Win exciting prizes and get a chance to showcase your projects to industry professionals.',
    timestamp: '4 days ago',
    likes: 98,
    comments: 21,
    isLiked: true
  },
  {
    id: 'event-3',
    author: {
      name: 'Placement Cell',
      avatar: '',
      role: 'faculty'
    },
    content: '🚀 Attention final year students! Microsoft is visiting our campus for placements on June 5th. Register on the placement portal before May 25th to be eligible.',
    image: 'https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    timestamp: 'Last week',
    likes: 215,
    comments: 45,
    isLiked: false
  }
];

export function EventFeed() {
  const [events, setEvents] = useState<Omit<PostCardProps, 'className'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from API
    const timer = setTimeout(() => {
      setEvents(EVENTS_DATA);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Upcoming Events</h2>
      </div>

      {loading ? (
        // Skeleton loading UI
        Array.from({ length: 2 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton-pulse w-10 h-10 rounded-full"></div>
              <div className="space-y-2">
                <div className="skeleton-pulse w-32 h-4"></div>
                <div className="skeleton-pulse w-24 h-3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="skeleton-pulse w-full h-4"></div>
              <div className="skeleton-pulse w-3/4 h-4"></div>
            </div>
            <div className="skeleton-pulse w-full h-48 rounded-lg"></div>
          </div>
        ))
      ) : (
        events.map(event => (
          <PostCard
            key={event.id}
            {...event}
          />
        ))
      )}
    </div>
  );
}

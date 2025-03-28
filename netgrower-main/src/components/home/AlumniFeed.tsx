
import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import { PostCard, PostCardProps } from '@/components/common/PostCard';

// Mock data for alumni posts
const ALUMNI_DATA: Omit<PostCardProps, 'className'>[] = [
  {
    id: 'alumni-1',
    author: {
      name: 'Aarav Patel',
      avatar: '',
      role: 'alumni'
    },
    content: 'Excited to share that I\'ve joined Google as a Senior Software Engineer! The foundation laid at LNCT has been instrumental in my journey. Forever grateful to my professors and peers.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80',
    timestamp: 'Yesterday',
    likes: 324,
    comments: 78,
    isLiked: true
  },
  {
    id: 'alumni-2',
    author: {
      name: 'Priya Singh',
      avatar: '',
      role: 'alumni'
    },
    content: 'Thrilled to announce that our startup received $2M in seed funding! Looking for talented LNCT graduates to join our engineering team. DM for details.',
    timestamp: '3 days ago',
    likes: 156,
    comments: 42,
    isLiked: false
  },
  {
    id: 'alumni-3',
    author: {
      name: 'Vikram Malhotra',
      avatar: '',
      role: 'alumni'
    },
    content: 'Returning to campus next month to conduct a workshop on "AI in Healthcare". Can\'t wait to connect with current students and share insights from my journey!',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    timestamp: 'Last week',
    likes: 183,
    comments: 29,
    isLiked: false
  }
];

export function AlumniFeed() {
  const [alumni, setAlumni] = useState<Omit<PostCardProps, 'className'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from API
    const timer = setTimeout(() => {
      setAlumni(ALUMNI_DATA);
      setLoading(false);
    }, 1500); // Slightly delayed to stagger loading with EventFeed

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Alumni Updates</h2>
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
        alumni.map(post => (
          <PostCard
            key={post.id}
            {...post}
          />
        ))
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard, PostCardProps } from '@/components/common/PostCard';
import { Search, TrendingUp, Clock, MessageCircle, PlusCircle } from 'lucide-react';

// Mock forum posts
const FORUM_POSTS: Omit<PostCardProps, 'className'>[] = [
  {
    id: 'forum-1',
    author: {
      name: 'Deepika Verma',
      avatar: '',
      role: 'student'
    },
    content: 'Has anyone taken the Machine Learning elective with Dr. Sharma? I\'m trying to decide between that and Advanced Database Systems for next semester.',
    timestamp: '3 hours ago',
    likes: 12,
    comments: 8,
    isLiked: false
  },
  {
    id: 'forum-2',
    author: {
      name: 'Arjun Singh',
      avatar: '',
      role: 'student'
    },
    content: 'Just shared my final year project on GitHub - A smart attendance system using facial recognition. Feel free to check it out and provide feedback!',
    image: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    timestamp: '6 hours ago',
    likes: 45,
    comments: 15,
    isLiked: true
  },
  {
    id: 'forum-3',
    author: {
      name: 'Prof. Rajeev Kumar',
      avatar: '',
      role: 'faculty'
    },
    content: 'Reminder: The deadline for submitting research papers to the International Conference on Emerging Technologies is September 15th. Contact me if you need guidance on your submissions.',
    timestamp: 'Yesterday',
    likes: 32,
    comments: 5,
    isLiked: false
  },
  {
    id: 'forum-4',
    author: {
      name: 'Meera Patel',
      avatar: '',
      role: 'student'
    },
    content: 'Does anyone have notes for Operating Systems from last semester? The final exam is approaching and I missed a few classes.',
    timestamp: '2 days ago',
    likes: 18,
    comments: 23,
    isLiked: false
  }
];

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState(FORUM_POSTS);

  return (
    <div className="page-transition pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Forum</h1>
        <Button className="rounded-full gap-2">
          <PlusCircle className="w-4 h-4" />
          <span>New Post</span>
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search discussions..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>All Posts</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {posts.map(post => (
            <PostCard key={post.id} {...post} />
          ))}
        </TabsContent>
        
        <TabsContent value="trending" className="space-y-6">
          {posts
            .sort((a, b) => b.likes - a.likes)
            .map(post => (
              <PostCard key={post.id} {...post} />
            ))}
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-6">
          {posts
            .sort((a, b) => {
              const dateA = new Date(a.timestamp);
              const dateB = new Date(b.timestamp);
              return dateB.getTime() - dateA.getTime();
            })
            .map(post => (
              <PostCard key={post.id} {...post} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Forum;

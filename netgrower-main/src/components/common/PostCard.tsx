
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PostCardProps {
  id: string;
  author: {
    name: string;
    avatar: string;
    role?: 'student' | 'alumni' | 'faculty';
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  className?: string;
}

export function PostCard({
  id,
  author,
  content,
  image,
  timestamp,
  likes,
  comments,
  isLiked = false,
  className,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={cn(
      "glass-card rounded-xl overflow-hidden animate-fade-in hover-scale",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{author.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span>{timestamp}</span>
                {author.role && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{author.role}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="mt-3">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        
        {image && (
          <div className="mt-3 rounded-lg overflow-hidden bg-muted">
            <img 
              src={image} 
              alt="Post content" 
              className="w-full h-auto max-h-96 object-cover" 
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-xs font-normal"
            onClick={handleLike}
          >
            <Heart 
              className={cn(
                "w-4 h-4", 
                liked ? "fill-destructive text-destructive" : ""
              )} 
            />
            <span>{likeCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-xs font-normal"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-xs font-normal"
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

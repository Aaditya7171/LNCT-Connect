
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
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
  onClick?: () => void;
  onLike?: () => void;
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
  onClick,
  onLike,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  // Update local state when props change
  useEffect(() => {
    setLiked(isLiked);
    setLikeCount(likes);
  }, [isLiked, likes]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click

    if (onLike) {
      // Let the parent component handle the like action
      onLike();
    } else {
      // Fallback to local state management if no handler provided
      if (liked) {
        setLikeCount(prev => prev - 1);
      } else {
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    }
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
    <div
      className={cn(
        "glass-card rounded-xl overflow-hidden animate-fade-in hover-scale cursor-pointer",
        className
      )}
      onClick={onClick}
    >
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
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={(e) => e.stopPropagation()} // Prevent triggering card click
          >
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

        <div className="flex items-center gap-4 mt-4 pt-2 border-t border-border">
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
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering card click
              onClick && onClick(); // Use the same click handler as the card
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

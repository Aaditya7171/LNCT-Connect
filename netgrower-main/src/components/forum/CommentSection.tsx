import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { addComment } from '@/services/api/forum';
import { ForumComment } from '@/services/api/forum';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/services/api/client';

interface CommentSectionProps {
  postId: string;
  comments: ForumComment[];
  onCommentAdded: (comment: ForumComment) => void;
}

export function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  };
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please enter a comment',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const comment = await addComment(postId, newComment);
      
      // Add the new comment to the list
      onCommentAdded(comment);
      
      // Clear the comment input
      setNewComment('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format the comment time
  const formatCommentTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format profile picture URL
  const formatProfilePicture = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    
    // If the URL already includes the API_URL, return it as is
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    
    // Otherwise, prepend the API_URL
    return `${API_URL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      
      {/* Add comment form */}
      <div className="space-y-4">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={handleCommentChange}
          disabled={isSubmitting}
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitComment} 
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </Button>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={formatProfilePicture(comment.profile_picture)} 
                  alt={comment.user_name} 
                />
                <AvatarFallback>{getInitials(comment.user_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCommentTime(comment.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

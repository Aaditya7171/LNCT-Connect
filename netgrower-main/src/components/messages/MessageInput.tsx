import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, X, File, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  newMessage: string;
  attachment: File | null;
  showAttachmentPreview: boolean;
  onMessageChange: (message: string) => void;
  onAttachmentChange: (file: File | null) => void;
  onShowAttachmentPreviewChange: (show: boolean) => void;
  onSendMessage: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  attachment,
  showAttachmentPreview,
  onMessageChange,
  onAttachmentChange,
  onShowAttachmentPreviewChange,
  onSendMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 5MB",
        });
        return;
      }

      onAttachmentChange(file);
      onShowAttachmentPreviewChange(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const renderAttachmentPreview = () => {
    if (!attachment) return null;

    const fileType = attachment.type.split('/')[0];
    const fileExtension = attachment.name.split('.').pop()?.toLowerCase();

    if (fileType === 'image') {
      return (
        <div className="relative">
          <img
            src={URL.createObjectURL(attachment)}
            alt="Attachment preview"
            className="max-w-[200px] max-h-[200px] rounded-md"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => {
              onAttachmentChange(null);
              onShowAttachmentPreviewChange(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    } else if (fileExtension === 'pdf') {
      return (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-md relative">
          <div className="bg-primary/10 p-2 rounded">
            <File className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">PDF Document</p>
            <p className="text-xs text-muted-foreground">{attachment.name}</p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => {
              onAttachmentChange(null);
              onShowAttachmentPreviewChange(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      return (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-md relative">
          <div className="bg-primary/10 p-2 rounded">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Word Document</p>
            <p className="text-xs text-muted-foreground">{attachment.name}</p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => {
              onAttachmentChange(null);
              onShowAttachmentPreviewChange(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-md relative">
          <div className="bg-primary/10 p-2 rounded">
            <File className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">File</p>
            <p className="text-xs text-muted-foreground">{attachment.name}</p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => {
              onAttachmentChange(null);
              onShowAttachmentPreviewChange(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  };

  // In the return JSX of MessageInput component, update the send button
  return (
    <div className="p-4 border-t">
      {/* Attachment preview */}
      {showAttachmentPreview && renderAttachmentPreview()}
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleFileButtonClick}
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        
        <Button
          type="button"
          size="icon"
          onClick={onSendMessage}
          disabled={!newMessage.trim() && !attachment}
          className={`flex-shrink-0 ${
            newMessage.trim() || attachment 
              ? 'bg-primary hover:bg-primary/90 animate-pulse shadow-lg shadow-primary/50' 
              : ''
          }`}
        >
          <Send className="h-5 w-5" />
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
      </div>
    </div>
  );
};

export default MessageInput;
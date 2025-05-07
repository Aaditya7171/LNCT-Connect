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

    // Common remove button component
    const RemoveButton = () => (
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 shadow-sm hover:shadow-md transition-shadow"
        onClick={() => {
          onAttachmentChange(null);
          onShowAttachmentPreviewChange(false);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    );

    // File size formatter
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    if (fileType === 'image') {
      return (
        <div className="relative group mb-3 inline-block">
          <img
            src={URL.createObjectURL(attachment)}
            alt="Attachment preview"
            className="max-w-[200px] max-h-[200px] rounded-md shadow-md hover:shadow-lg transition-shadow"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md">
            <p className="truncate">{attachment.name}</p>
            <p>{formatFileSize(attachment.size)}</p>
          </div>
          <RemoveButton />
        </div>
      );
    } else if (fileExtension === 'pdf') {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md relative mb-3 shadow-md">
          <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded">
            <File className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">PDF Document</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">{attachment.name}</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">{formatFileSize(attachment.size)}</p>
          </div>
          <RemoveButton />
        </div>
      );
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md relative mb-3 shadow-md">
          <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Word Document</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{attachment.name}</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{formatFileSize(attachment.size)}</p>
          </div>
          <RemoveButton />
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md relative mb-3 shadow-md">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <File className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">File Attachment</p>
            <p className="text-xs text-gray-600/70 dark:text-gray-400/70">{attachment.name}</p>
            <p className="text-xs text-gray-600/70 dark:text-gray-400/70">{formatFileSize(attachment.size)}</p>
          </div>
          <RemoveButton />
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
          className="flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Attach a file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
        />

        <Button
          type="button"
          size="icon"
          onClick={onSendMessage}
          disabled={!newMessage.trim() && !attachment}
          className={`flex-shrink-0 ${newMessage.trim() || attachment
            ? 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out'
            : 'opacity-50'
            }`}
        >
          <Send className={`h-5 w-5 ${(newMessage.trim() || attachment) ? 'animate-pulse' : ''}`} />
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
import React, { useState } from 'react';
import { AlertTriangle, PlusCircle, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock data for alerts
const INITIAL_ALERTS = [
  {
    id: '1',
    content: 'Important: Campus will be closed on May 15th for maintenance. All classes will be conducted online.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    image: null,
    priority: 'high'
  },
  {
    id: '2',
    content: 'Reminder: Last date for fee submission is June 30th. Late fees will be applicable after the deadline.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    priority: 'medium'
  },
  {
    id: '3',
    content: 'New course on Artificial Intelligence added to the curriculum for the next semester. Registration starts next week.',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    image: null,
    priority: 'low'
  }
];

interface Alert {
  id: string;
  content: string;
  date: Date;
  image: string | null;
  priority: 'high' | 'medium' | 'low';
}

export function AlertsSection() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlertContent, setNewAlertContent] = useState('');
  const [newAlertPriority, setNewAlertPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newAlertImage, setNewAlertImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCreateAlert = () => {
    if (!newAlertContent.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter content for the alert',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newAlert: Alert = {
        id: Date.now().toString(),
        content: newAlertContent,
        date: new Date(),
        image: imagePreview,
        priority: newAlertPriority
      };

      setAlerts([newAlert, ...alerts]);
      setNewAlertContent('');
      setNewAlertPriority('medium');
      setNewAlertImage(null);
      setImagePreview(null);
      setIsCreateDialogOpen(false);
      setIsSubmitting(false);

      toast({
        title: 'Alert created',
        description: 'Your alert has been created successfully',
      });
    }, 1000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive'
        });
        return;
      }
      
      setNewAlertImage(selectedFile);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveImage = () => {
    setNewAlertImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-orange-500';
      case 'medium':
        return 'from-yellow-500 to-amber-500';
      case 'low':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <div className="space-y-6 transform transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">College Alerts</h2>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          size="sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Alert
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={cn(
              "overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px]",
              "bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/20"
            )}
          >
            <div className={cn(
              "h-1 w-full bg-gradient-to-r", 
              getPriorityColor(alert.priority)
            )} />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  College Alert
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(alert.date)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{alert.content}</p>
              {alert.image && (
                <div className="rounded-md overflow-hidden mt-2">
                  <img 
                    src={alert.image} 
                    alt="Alert" 
                    className="w-full h-auto max-h-48 object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && setIsCreateDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <Button
                    key={priority}
                    type="button"
                    variant={newAlertPriority === priority ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewAlertPriority(priority)}
                    className={cn(
                      "capitalize",
                      newAlertPriority === priority && 
                      `bg-gradient-to-r ${getPriorityColor(priority)} text-white border-none`
                    )}
                  >
                    {priority}
                  </Button>
                ))}
              </div>
            </div>
            
            <Textarea
              placeholder="Enter alert content..."
              className="min-h-[120px]"
              value={newAlertContent}
              onChange={(e) => setNewAlertContent(e.target.value)}
              disabled={isSubmitting}
            />
            
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-[200px] rounded-md object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                ref={fileInputRef}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || !!imagePreview}
                className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-800"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlert} 
              disabled={isSubmitting || !newAlertContent.trim()}
              className={cn(
                "bg-gradient-to-r text-white",
                getPriorityColor(newAlertPriority)
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Alert'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

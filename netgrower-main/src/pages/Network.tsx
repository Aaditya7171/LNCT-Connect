
// Update the import statement at the top of the file
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Users, UserCheck, UserX, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/services/api';

// Update the NetworkUser interface to include the new status types
interface NetworkUser {
  id: string;
  name: string;
  profile_picture: string;
  college: string;
  branch: string;
  batch?: string;
  connection_status: 'connected' | 'pending-sent' | 'pending-received' | 'none';
}

// Remove the duplicate import: import { useNavigate } from 'react-router-dom';

// Add these helper functions before the NetworkUserCard component
const getConnectionButtonText = (status: string) => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'pending-sent':
      return 'Pending';
    case 'pending-received':
      return 'Accept';
    case 'none':
      return 'Connect';
    default:
      return 'Connect';
  }
};

// In the NetworkUserCard component, add a message button
const NetworkUserCard = ({ user, onUpdateConnection }: {
  user: NetworkUser,
  onUpdateConnection: (id: string, status: 'connected' | 'pending' | 'none') => void
}) => {
  const navigate = useNavigate();

  // Add this function to format profile picture URL
  const getProfilePictureUrl = (profilePicture: string) => {
    if (!profilePicture) return '';

    // If it's already a full URL (starts with http or https), return as is
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }

    // Otherwise, prepend the API URL
    return `${API_URL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
  };

  // Add this function to handle messaging
  const handleMessage = () => {
    // Store the user info in localStorage to access it in Messages component
    localStorage.setItem('messageUser', JSON.stringify({
      user_id: user.id,
      name: user.name,
      profile_picture: user.profile_picture,
      connection_status: user.connection_status
    }));

    // Navigate to messages page
    navigate('/messages');
  };

  // Add the missing handleConnectionAction function
  const handleConnectionAction = (userId: string, status: string) => {
    if (status === 'connected') {
      // If already connected, disconnect
      onUpdateConnection(userId, 'none');
    } else if (status === 'pending-received') {
      // If pending request received, accept it
      onUpdateConnection(userId, 'connected');
    } else if (status === 'pending-sent') {
      // If pending request sent, cancel it
      onUpdateConnection(userId, 'none');
    } else {
      // If not connected, send connection request
      onUpdateConnection(userId, 'pending');
    }
  };

  // In the return JSX, add a message button next to the connect button
  return (
    <div className="glass-card rounded-xl p-4 animate-fade-in">
      {/* User info section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={getProfilePictureUrl(user.profile_picture)} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">
              {user.branch}, {user.college} {user.batch ? `(${user.batch})` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Only show message button if connected */}
          {user.connection_status === 'connected' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleMessage}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Message</span>
            </Button>
          )}

          {/* Existing connect/accept buttons */}
          <Button
            variant={user.connection_status === 'connected' ? 'outline' : 'default'}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handleConnectionAction(user.id, user.connection_status)}
          >
            {user.connection_status === 'connected' ? (
              <UserCheck className="h-4 w-4" />
            ) : user.connection_status === 'pending-received' ? (
              <Check className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span>{getConnectionButtonText(user.connection_status)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

const Network = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNetworkUsers();
  }, []);

  // Update the fetchNetworkUsers function to handle errors better
  const fetchNetworkUsers = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "You need to be logged in to view your network.",
        });
        return;
      }

      console.log("Fetching network users for userId:", userId);

      // Make sure the server is running and the endpoint exists
      const response = await fetch(`${API_URL}/api/connections/users/${userId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response error:", response.status, errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Network users data:", data);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching network users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load network users. Please try again.",
      });
      // Set empty array to avoid undefined errors
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConnectionStatus = async (targetUserId: string, status: 'connected' | 'pending' | 'none') => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "You need to be logged in to update connections.",
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/connections/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          userId,
          targetUserId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update connection');
      }

      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === targetUserId ? { ...user, connection_status: status } : user
      ));

      // Show success message
      toast({
        title: "Connection updated",
        description: status === 'connected'
          ? "Connection accepted successfully"
          : status === 'pending'
            ? "Connection request sent"
            : "Connection removed",
      });
    } catch (error) {
      console.error("Error updating connection:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update connection. Please try again.",
      });
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.college?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get connections, pending requests, and suggestions
  const connections = filteredUsers.filter(user => user.connection_status === 'connected');
  const pendingSentRequests = filteredUsers.filter(user => user.connection_status === 'pending-sent');
  const pendingReceivedRequests = filteredUsers.filter(user => user.connection_status === 'pending-received');
  const suggestions = filteredUsers.filter(user => user.connection_status === 'none');

  return (
    <div className="page-transition pb-20 md:pb-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Network</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search people..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="connections">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span>Connections ({connections.length})</span>
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Received ({pendingReceivedRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Sent ({pendingSentRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Suggestions ({suggestions.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading connections...</div>
          ) : connections.length > 0 ? (
            connections.map(user => (
              <NetworkUserCard
                key={user.id}
                user={user}
                onUpdateConnection={updateConnectionStatus}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              You don't have any connections yet. Check out the suggestions tab to connect with people.
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading received requests...</div>
          ) : pendingReceivedRequests.length > 0 ? (
            pendingReceivedRequests.map(user => (
              <NetworkUserCard
                key={user.id}
                user={user}
                onUpdateConnection={updateConnectionStatus}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending connection requests received.
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading sent requests...</div>
          ) : pendingSentRequests.length > 0 ? (
            pendingSentRequests.map(user => (
              <NetworkUserCard
                key={user.id}
                user={user}
                onUpdateConnection={updateConnectionStatus}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending connection requests sent.
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading suggestions...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map(user => (
              <NetworkUserCard
                key={user.id}
                user={user}
                onUpdateConnection={updateConnectionStatus}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No suggestions available at the moment.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Network;

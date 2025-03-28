
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Users, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkUser {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'alumni' | 'faculty';
  department: string;
  batch?: string;
  connection: 'connected' | 'pending' | 'none';
}

// Mock network data
const NETWORK_USERS: NetworkUser[] = [
  {
    id: 'user-1',
    name: 'Aarav Patel',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    role: 'alumni',
    department: 'Computer Science',
    batch: '2019',
    connection: 'connected'
  },
  {
    id: 'user-2',
    name: 'Priya Singh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    role: 'alumni',
    department: 'Electronics',
    batch: '2020',
    connection: 'pending'
  },
  {
    id: 'user-3',
    name: 'Dr. Rajeev Kumar',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    role: 'faculty',
    department: 'Computer Science',
    connection: 'none'
  },
  {
    id: 'user-4',
    name: 'Anjali Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
    role: 'student',
    department: 'Electronics',
    batch: '2023',
    connection: 'connected'
  },
  {
    id: 'user-5',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    role: 'alumni',
    department: 'Computer Science',
    batch: '2019',
    connection: 'connected'
  },
  {
    id: 'user-6',
    name: 'Neha Joshi',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80',
    role: 'student',
    department: 'Mechanical Engineering',
    batch: '2022',
    connection: 'connected'
  },
  {
    id: 'user-7',
    name: 'Samarth Gupta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    role: 'student',
    department: 'Computer Science',
    batch: '2024',
    connection: 'none'
  }
];

// Network user card component
const NetworkUserCard = ({ user, onUpdateConnection }: { 
  user: NetworkUser, 
  onUpdateConnection: (id: string, status: 'connected' | 'pending' | 'none') => void 
}) => {
  const handleConnect = () => {
    onUpdateConnection(user.id, 'pending');
  };

  const handleAccept = () => {
    onUpdateConnection(user.id, 'connected');
  };

  const handleReject = () => {
    onUpdateConnection(user.id, 'none');
  };

  const handleDisconnect = () => {
    onUpdateConnection(user.id, 'none');
  };

  return (
    <div className="glass-card rounded-xl p-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-xs text-muted-foreground">
              {user.department} • {user.role === 'faculty' ? 'Faculty' : user.role === 'alumni' ? `Alumni (${user.batch})` : `Student (${user.batch})`}
            </p>
          </div>
        </div>
        
        <div>
          {user.connection === 'none' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full gap-1"
              onClick={handleConnect}
            >
              <UserPlus className="w-3 h-3" />
              <span>Connect</span>
            </Button>
          )}
          
          {user.connection === 'pending' && (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-full"
                onClick={handleAccept}
              >
                <UserCheck className="w-3 h-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={handleReject}
              >
                <UserX className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {user.connection === 'connected' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
            >
              Message
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Network = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(NETWORK_USERS);

  const updateConnectionStatus = (id: string, status: 'connected' | 'pending' | 'none') => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, connection: status } : user
    ));
  };

  const connectionCount = users.filter(user => user.connection === 'connected').length;
  const pendingCount = users.filter(user => user.connection === 'pending').length;

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
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span>Connections ({connectionCount})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Pending ({pendingCount})</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Suggestions</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="space-y-4">
          {users.filter(user => user.connection === 'connected').map(user => (
            <NetworkUserCard 
              key={user.id} 
              user={user} 
              onUpdateConnection={updateConnectionStatus} 
            />
          ))}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          {users.filter(user => user.connection === 'pending').map(user => (
            <NetworkUserCard 
              key={user.id} 
              user={user} 
              onUpdateConnection={updateConnectionStatus} 
            />
          ))}
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-4">
          {users.filter(user => user.connection === 'none').map(user => (
            <NetworkUserCard 
              key={user.id} 
              user={user} 
              onUpdateConnection={updateConnectionStatus} 
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Network;

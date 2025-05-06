import { io, Socket } from 'socket.io-client';
import { API_URL } from './api/client';

interface MessageData {
  to: string;
  message: string;
  attachmentUrl?: string;
  messageType?: 'text' | 'image' | 'pdf' | 'docx';
}

// Improve the socket service to handle connections better
export class SocketService {
  private socket: Socket | null = null;
  private initialized = false;
  private errorListeners: ((error: any) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Update the initialize method to handle token authentication properly
  public initialize() {
      if (this.initialized) return;
  
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
  
      if (!token || !userId) {
        console.error('Cannot initialize socket: missing authentication');
        return;
      }
  
      console.log('Initializing socket with token length:', token.length);
  
      this.socket = io(API_URL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: {
          token: token // Send the token exactly as stored in localStorage
        },
        query: {
          userId: userId
        }
      });
  
      // Set up event listeners
      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.notifyConnectionListeners(true);
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Join a room with the user's ID for private messages
        this.socket.emit('join', { room: userId });
        console.log(`Joining room: ${userId}`);
      });
  
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.notifyErrorListeners(error);
        this.notifyConnectionListeners(false);
        
        // If it's an authentication error, clear the token
        if (error.message.includes('authentication')) {
          console.log('Socket authentication error, clearing token');
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('user');
          
          // Redirect to login page if not already there
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
        } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.log('Max reconnect attempts reached, giving up');
        }
      });
  
      // Rest of the event listeners...
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect socket...');
      this.connect();
    }, 5000 * Math.min(this.reconnectAttempts, 5)); // Increasing backoff
  }

  public connect() {
    if (!this.socket) {
      this.initialize();
    }

    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      console.log('Socket connecting...');
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Intentional disconnect, not attempting to reconnect');
    }
  }

  // Add this method to match what's being called in Messages.tsx
  public onNewMessage(callback: (data: any) => void) {
    return this.onMessage(callback);
  }

  public onMessage(callback: (data: any) => void) {
    if (!this.socket) {
      this.initialize();
      this.connect();
    }

    this.socket?.on('private-message', callback);

    return () => {
      this.socket?.off('private-message', callback);
    };
  }

  public onError(callback: (error: any) => void) {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(listener => listener !== callback);
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
    };
  }

  private notifyErrorListeners(error: any) {
    this.errorListeners.forEach(listener => listener(error));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  public sendMessage(data: MessageData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('private-message', data);
    } else {
      console.error('Socket not connected');
      this.errorListeners.forEach(listener =>
        listener({ message: 'Not connected to server' })
      );
    }
  }

  public isConnected() {
    return this.socket?.connected || false;
  }
}

// Create a singleton instance
export const socketService = new SocketService();
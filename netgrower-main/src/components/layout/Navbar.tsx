
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MessagesSquare,
  Users,
  MessageCircle,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      navigate('/auth');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred during logout."
      });
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <>
      {/* Header for mobile */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-30 flex items-center justify-between px-4 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="LNCT Connect Logo" className="h-8 w-auto" />
          <h1 className="text-xl font-semibold">LNCT Connect</h1>
        </Link>
        <div className="flex items-center gap-2">
          {/* Temporarily comment out ThemeToggle to check if it's causing issues */}
          {/* <ThemeToggle /> */}
          <button
            className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors"
            onClick={user ? handleLogout : handleLogin}
          >
            {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border z-30 flex justify-around items-center h-16 md:hidden">
        <Link
          to="/"
          className={cn(
            "navbar-icon",
            path === '/' && "active"
          )}
        >
          <Home className="w-6 h-6" />
        </Link>
        <Link
          to="/forum"
          className={cn(
            "navbar-icon",
            path === '/forum' && "active"
          )}
        >
          <MessageCircle className="w-6 h-6" />
        </Link>
        <Link
          to="/messages"
          className={cn(
            "navbar-icon",
            path === '/messages' && "active"
          )}
        >
          <MessagesSquare className="w-6 h-6" />
        </Link>
        <Link
          to="/network"
          className={cn(
            "navbar-icon",
            path === '/network' && "active"
          )}
        >
          <Users className="w-6 h-6" />
        </Link>
        <Link
          to="/profile"
          className={cn(
            "navbar-icon",
            path === '/profile' && "active"
          )}
        >
          <User className="w-6 h-6" />
        </Link>
      </nav>
    </>
  );
}

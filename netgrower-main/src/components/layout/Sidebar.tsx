
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MessagesSquare,
  Users,
  MessageCircle,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200",
      isActive
        ? "bg-accent text-accent-foreground font-medium"
        : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
    )}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </Link>
);

export function Sidebar() {
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
    <aside className="hidden md:flex flex-col h-screen w-64 bg-card border-r border-border fixed top-0 left-0 z-30">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          {/* Replace the LC text with favicon.png image */}
          <img
            src="/favicon.png"
            alt="LNCT Connect Logo"
            className="w-8 h-8 rounded-md"
          />
          <h1 className="text-xl font-semibold">LNCT Connect</h1>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem
          to="/"
          icon={<Home className="w-5 h-5" />}
          label="Home"
          isActive={path === '/'}
        />
        <NavItem
          to="/forum"
          icon={<MessageCircle className="w-5 h-5" />}
          label="Forum"
          isActive={path === '/forum'}
        />
        <NavItem
          to="/messages"
          icon={<MessagesSquare className="w-5 h-5" />}
          label="Messages"
          isActive={path === '/messages'}
        />
        <NavItem
          to="/network"
          icon={<Users className="w-5 h-5" />}
          label="Network"
          isActive={path === '/network'}
        />
        <NavItem
          to="/profile"
          icon={<User className="w-5 h-5" />}
          label="Profile"
          isActive={path === '/profile'}
        />
      </nav>

      <div className="p-4 border-t border-border flex justify-between items-center">
        <ThemeToggle />
        <button
          className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors"
          onClick={user ? handleLogout : handleLogin}
          title={user ? "Sign out" : "Sign in"}
        >
          {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}


import React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("w-10 h-10 rounded-full", className)}
          aria-label="Toggle theme"
        >
          {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
          {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
          {theme === 'purple' && <Palette className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-scale-in">
        <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2 cursor-pointer">
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2 cursor-pointer">
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('purple')} className="flex items-center gap-2 cursor-pointer">
          <Palette className="h-4 w-4" />
          <span>Purple</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

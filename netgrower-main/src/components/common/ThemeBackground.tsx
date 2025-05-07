import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Use useEffect to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client-side
  if (!mounted || theme !== 'purple') {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-0 animate-fade-in"
      style={{ animationDelay: '0.2s', animationDuration: '1.5s', animationFillMode: 'forwards' }}>
      {/* Base gradient - darker and richer */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-purple-800/15 to-indigo-900/20" />

      {/* Top gradient - deeper purple */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-purple-800/25 to-transparent" />

      {/* Bottom gradient - deeper indigo */}
      <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-indigo-900/25 to-transparent" />

      {/* Decorative blobs with custom animations - richer colors and higher opacity */}
      <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-purple-700/20 blur-3xl animate-pulse-slow animate-float"
        style={{ animationDuration: '15s' }} />
      <div className="absolute bottom-[20%] left-[15%] w-[25vw] h-[25vw] rounded-full bg-indigo-700/20 blur-3xl animate-pulse-slow animate-float"
        style={{ animationDuration: '20s', animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[5%] w-[15vw] h-[15vw] rounded-full bg-violet-800/20 blur-3xl animate-pulse-slow animate-float"
        style={{ animationDuration: '25s', animationDelay: '1s' }} />
      <div className="absolute bottom-[10%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-fuchsia-700/15 blur-3xl animate-pulse-slow animate-float"
        style={{ animationDuration: '18s', animationDelay: '3s' }} />

      {/* Enhanced pattern overlay */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMGMxNi41NjkgMCAzMCAxMy40MzEgMzAgMzBTNDYuNTY5IDYwIDMwIDYwIDAgNDYuNTY5IDAgMzAgMTMuNDMxIDAgMzAgMHptMCA1Yy0xMy44MDcgMC0yNSAxMS4xOTMtMjUgMjVzMTEuMTkzIDI1IDI1IDI1IDI1LTExLjE5MyAyNS0yNS0xMS4xOTMtMjUtMjUtMjV6IiBmaWxsPSIjQTc4QkZBIiBmaWxsLXJ1bGU9Im5vbnplcm8iIG9wYWNpdHk9Ii4zIi8+PC9zdmc+')]" />

      {/* Additional subtle light effects */}
      <div className="absolute top-0 left-[30%] w-[40vw] h-[20vh] bg-gradient-to-b from-purple-500/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 right-[20%] w-[30vw] h-[15vh] bg-gradient-to-t from-indigo-600/10 to-transparent blur-3xl" />

      {/* Shimmer effects */}
      <div className="absolute top-[25%] left-0 right-0 h-[2px] animate-shimmer" />
      <div className="absolute top-[75%] left-0 right-0 h-[1px] animate-shimmer" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[40%] left-0 right-0 h-[1px] animate-shimmer" style={{ animationDelay: '4s' }} />
    </div>
  );
}

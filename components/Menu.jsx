"use client"

import { useEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Home,
  User,
  FileEdit,
  BookOpen,
  Contact,
  Info,
  Code,
  Calendar,
  X,
  Menu as MenuIcon
} from "lucide-react"

const menuItems = [
  { label: 'Home', icon: Home, href: '/' },
{ 
  label: 'Info', 
  icon: BookOpen, 
  href: 'https://drive.google.com/drive/folders/10TI0S_y-zrwvnXzYgdP_TbtJpKcFNQuM?usp=drive_link',
  target: '_blank'
},  { label: 'Brochure', icon: BookOpen, href: '#' },
  { label: 'Developers', icon: Code, href: '/developer' },
  { label: 'Events', icon: Calendar, href: '/events/register' },
  { label: 'Rules', icon: BookOpen, href: '/rules' },
  { label: 'Profile', icon: User, href: '/user/account' },
  { label: 'Login', icon: FileEdit, href: '/user/register' },
]

export default function Menu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Initial check on mount
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleOpenChange = (newOpen) => {
    if (newOpen) {
      // Re-check auth status every time the menu is opened
      setIsLoggedIn(!!localStorage.getItem('token'));
    }
    setOpen(newOpen);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <div className="fixed top-3 right-3 z-[100]">
        <DrawerTrigger render={
          <Button
            variant="ghost"
            className="group relative !bg-[#010c18]/80 hover:!bg-cyan-950/60 text-cyan-300 hover:text-cyan-100 rounded-2xl border border-cyan-500/50 hover:border-cyan-400 p-5 w-16 h-16 flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] overflow-hidden backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {open ? (
              <X className="w-8 h-8 text-cyan-400 group-hover:text-cyan-200 relative z-10 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-colors" />
            ) : (
              <MenuIcon className="w-8 h-8 text-cyan-400 group-hover:text-cyan-200 relative z-10 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-colors" />
            )}
          </Button>
        } />
      </div>
      <DrawerContent className="bg-transparent border-none shadow-none text-white p-4 font-mono">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <nav className="flex min-h-0 flex-1 flex-col gap-3 w-full max-w-sm mx-auto overflow-y-auto no-scrollbar md:max-w-none px-2 pb-4 mt-6 md:mt-24">
          {menuItems.filter(item => {
            if (isLoggedIn && item.label === 'Login') return false;
            if (!isLoggedIn && item.label === 'Profile') return false;
            return true;
          }).map((item, index) => {
            const Icon = item.icon
            return (
              <a
                key={index}
                href={item.href}
                className="group relative flex items-center gap-4 px-6 py-4 bg-[#010c18]/90 backdrop-blur-md hover:bg-cyan-950/60 border border-cyan-400/10 hover:border-cyan-400/60 rounded-2xl transition-all duration-300 overflow-hidden"
                style={{
                  animation: `menuFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.08}s`,
                  opacity: 0
                }}
              >
                {/* Tech hover effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />

                <Icon className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-all relative z-10" />
                <span className="font-bold text-gray-300 group-hover:text-white tracking-[0.15em] uppercase text-sm relative z-10">
                  {item.label}
                </span>

                <span className="ml-auto text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-black relative z-10 tracking-widest">
                  {'>'}
                </span>
              </a>
            )
          })}
        </nav>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes menuFadeInUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}} />
      </DrawerContent>
    </Drawer>
  )
}

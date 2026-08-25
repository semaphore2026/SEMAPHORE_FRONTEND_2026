"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Home,
  User,
  FileEdit,
  BookOpen,
  Contact,
  Code,
  Calendar,
  Menu as MenuIcon,
  X as CloseIcon
} from "lucide-react"

const menuItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Login', icon: FileEdit, href: '/user/register' },
  { label: 'Brochure', icon: BookOpen, href: '#' },
  { label: 'Developers', icon: Code, href: '/developer' },
  { label: 'Contact', icon: Contact, href: '#infos' },
  { label: 'Events', icon: Calendar, href: '/events/register' },
  { label: 'Profile', icon: User, href: '/user/account' },
]

export default function Menu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed top-4 right-4 md:top-8 md:right-10 z-[110]">
        <Button
          variant="secondary"
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-[#020813]/40 hover:bg-[#020813]/60 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(0,243,255,0.15)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] text-cyan-300 hover:text-cyan-100 rounded-xl flex items-center justify-center transition-all w-14 h-14 p-0"
        >
          {isOpen ? (
            <>
          
              <CloseIcon className="w-6 h-6 text-cyan-300" />
            </>
          ) : (
            <>
              
              <MenuIcon className="w-6 h-6 text-cyan-300" />
            </>
          )}
        </Button>
      </div>

      {/* Menu Items Container */}
      {isOpen && (
        <div className="fixed top-[88px] right-4 md:top-[104px] md:right-10 z-[100] flex flex-col gap-3 w-[220px]">
          {menuItems.filter(item => !(isLoggedIn && item.label === 'Login')).map((item, index) => {
            const Icon = item.icon
            return (
              <a
                key={index}
                href={item.href}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
                className="animate-slide-left-fade flex items-center gap-4 px-6 py-4 bg-[#020813]/60 backdrop-blur-md border border-cyan-400/20 hover:border-cyan-400/60 hover:bg-[#020813]/80 rounded-xl transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.05)] hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] group"
              >
                <Icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold tracking-widest text-cyan-100 uppercase group-hover:text-white transition-colors">{item.label}</span>
              </a>
            )
          })}
        </div>
      )}

      {/* Custom Keyframes for stagger animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideLeftFade {
          from { opacity: 0; transform: translateX(100vw); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-left-fade {
          animation: slideLeftFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </>
  )
}

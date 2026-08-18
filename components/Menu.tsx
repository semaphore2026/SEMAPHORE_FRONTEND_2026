"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Home,
  KeyRound,
  User,
  FileEdit,
  BookOpen,
  CircleDollarSign,
  Contact,
  Code,
  Menu as MenuIcon
} from "lucide-react"

const menuItems = [
  { label: 'Home', icon: Home, href: '#' },
  { label: 'Login', icon: KeyRound, href: '#' },
  { label: 'Register', icon: FileEdit, href: '#' },
  { label: 'Brochure', icon: BookOpen, href: '#' },
  { label: 'Developers', icon: Code, href: '#dev-team' },
  { label: 'Contact', icon: Contact, href: '#info' },
  { label: 'Profile', icon: User, href: '#' },
]

export default function Menu() {
  return (
    <Drawer showSwipeHandle>
      <div className="fixed top-2 right-2 z-[100]">
        <DrawerTrigger render={
          <Button
            variant="secondary"
            className="bg-[#0d1424]/80 hover:bg-[#0d1424]/90 aria-expanded:bg-[#0d1424]/90 aria-expanded:text-white text-white rounded-md px-5 py-5 flex items-center gap-2 font-medium text-lg transition-colors border-none"
          >
            Menu
            <MenuIcon className="w-6 h-6 text-white" />
          </Button>
        } />
      </div>
      <DrawerContent className="bg-black/40 backdrop-blur border-t border-white/10 text-white p-4">
        <DrawerHeader className="text-center pt-2 pb-6">
          <DrawerTitle className="text-2xl font-bold text-white">Semaphore 2K26</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 max-w-sm mx-auto w-full overflow-y-auto max-h-[70vh] no-scrollbar">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-4 px-6 py-3.5 bg-[oklch(12.9%_0.042_264.695)] hover:bg-[oklch(27.7%_0.046_192.524)]  rounded-lg transition-colors duration-200"
              >
                <Icon className="w-5 h-5 text-gray-200" />
                <span className="font-semibold text-gray-100">{item.label}</span>
              </a>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Settings, ArrowLeft, Menu, LogOut, User, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logoutUser } from '@/lib/features/auth/authSlice';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: Package },
  { name: 'Developers', href: '/dashboard/developers', icon: Code2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, business } = useAppSelector((state) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await dispatch(logoutUser());
    setIsLoggingOut(false);
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-full w-64 bg-[#0a0a0a] border-r border-white/10 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logistics Admin Panel"
              width={120}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>

        {/* User Info */}
        {(user || business) && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-[#E4FF2C]/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#E4FF2C]" />
              </div>
              <div className="flex-1 min-w-0">
                {business?.name && (
                  <p className="text-white font-medium text-sm truncate">{business.name}</p>
                )}
                {user?.email && (
                  <p className="text-white/50 text-xs truncate">{user.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#E4FF2C]/10 text-[#E4FF2C] border-l-2 border-[#E4FF2C]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon className={cn('w-5 h-5', isActive ? 'text-[#E4FF2C]' : 'text-white/70')} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-4 py-3 text-white/50 hover:text-red-400 transition-colors text-sm w-full rounded-lg hover:bg-white/5"
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            Logout
          </button>
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Website
          </Link>
        </div>
      </div>
    </>
  );
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-white/10">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-white hover:bg-white/10"
      >
        <Menu className="w-6 h-6" />
      </Button>
      <span className="text-white font-semibold">Admin Panel</span>
      <div className="w-10" /> {/* Spacer for alignment */}
    </div>
  );
}

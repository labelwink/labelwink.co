'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Package, Heart, MapPin, User, Coins, Bell, ChevronRight, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useAuthModal } from '@/components/auth/OTPLoginModal';

const navItems = [
  { name: 'My Orders',    href: '/account/orders',         icon: Package },
  { name: 'Wishlist',     href: '/account/wishlist',       icon: Heart },
  { name: 'Profile',      href: '/account/profile',        icon: User },
  { name: 'Addresses',    href: '/account/addresses',      icon: MapPin },
  { name: 'Wink Points',  href: '/account/wink-points',    icon: Coins },
  { name: 'Referrals',    href: '/account/referrals',      icon: Gift },
  { name: 'Alerts',       href: '/account/alerts',         icon: Bell },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  const { openModal: openLoginModal } = useAuthModal();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setChecking(false);
    }
    check();
  }, []);

  useEffect(() => {
    // If not loading and no session -> prompt login
    if (!checking && !user && pathname !== '/account/login') {
      openLoginModal(pathname);
    }
  }, [checking, user, openLoginModal, pathname]);

  // Passthrough for login page
  if (pathname === '/account/login') {
    return <>{children}</>;
  }

  // Auth guard — block render if not authenticated
  if (!checking && !user) {
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/account' && pathname === '/account') return true;
    if (href !== '/account') return pathname.startsWith(href);
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <h2 className="font-heading text-2xl font-semibold mb-6 text-labelwink-green">My Account</h2>
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-none group",
                    active
                      ? "bg-labelwink-gold/10 text-labelwink-gold border-l-2 border-labelwink-gold"
                      : "text-labelwink-green/60 hover:bg-labelwink-cream-card hover:text-labelwink-green"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.name}</span>
                  <ChevronRight className={cn("w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity", active && "opacity-50")} />
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors text-left w-full mt-4 rounded-md"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Mobile horizontal tabs */}
        <div className="md:hidden overflow-x-auto no-scrollbar border-b border-labelwink-cream-border -mx-4 px-4">
          <div className="flex gap-1 min-w-max pb-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-none transition-colors",
                    active
                      ? "bg-labelwink-gold text-white"
                      : "text-labelwink-green/60 bg-labelwink-cream-card hover:bg-labelwink-cream-border"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

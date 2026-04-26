'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Package, Heart, MapPin, User, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Dashboard',  href: '/account',          icon: User },
  { name: 'My Orders',  href: '/account/orders',    icon: Package },
  { name: 'Returns',    href: '/account/returns',   icon: RotateCcw },
  { name: 'Wishlist',   href: '/account/wishlist',  icon: Heart },
  { name: 'Addresses',  href: '/account/addresses', icon: MapPin },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  if (pathname === '/account/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="font-heading text-2xl font-semibold mb-6">My Account</h2>
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sage/10 text-charcoal border-l-2 border-teal" 
                      : "text-muted-foreground hover:bg-sage/5 hover:text-charcoal"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-sage/5 hover:text-charcoal transition-colors text-left w-full mt-4"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

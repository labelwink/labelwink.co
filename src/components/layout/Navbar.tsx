'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X, Heart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

// Initial fallback items
const defaultNavItems = [
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Kurtas', href: '/collections/kurtas' },
  { label: 'Co-ords', href: '/collections/co-ords' },
  { label: 'Dresses', href: '/collections/dresses' },
  { label: 'Sale', href: '/collections/sale', className: 'text-red-600' },
];

export function Navbar({ navItems = defaultNavItems }: { navItems?: Array<{ label: string, href: string, className?: string }> }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { getTotals, setIsOpen } = useCartStore();
  const { totalQuantity } = getTotals();
  const supabase = createClient();


  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-cream/90 backdrop-blur-md border-b border-sage/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu */}
        <div className="flex items-center gap-4 lg:hidden flex-1">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="hover:bg-transparent">
                <Menu className="h-5 w-5" />
              </Button>
            } />
            <SheetContent side="left" className="w-[300px] bg-cream p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-sage/10 text-brand-wordmark">LABEL WINK</div>
                <nav className="flex-1 py-4">
                  {navItems.map((item) => (
                    <Link key={item.label || (item as any).name} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`block px-6 py-4 text-sm font-bold uppercase tracking-widest ${item.className || 'text-charcoal'}`}>
                      {item.label || (item as any).name}
                    </Link>
                  ))}
                </nav>
                <div className="p-6 bg-sage/5 space-y-4">
                  {user ? (
                    <>
                      <Link href="/account" className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4" /> My Account
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-destructive">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/account/login" className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-4 h-4" /> Login / Signup
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Search className="h-5 w-5 text-charcoal/70" />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 flex-1">
          {navItems.map((item) => (
            <Link key={item.label || (item as any).name} href={item.href} className={`text-nav-link hover:text-teal transition-colors ${item.className || ''}`}>
              {item.label || (item as any).name}
            </Link>
          ))}
        </nav>

        <Link href="/" className="text-brand-wordmark lg:flex-1 lg:text-center">
          LABEL WINK
        </Link>

        {/* Desktop Actions */}
        <div className="flex items-center justify-end gap-6 flex-1">
          <Search className="hidden lg:block h-5 w-5 text-charcoal/70 cursor-pointer hover:text-teal transition-colors" />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="hidden lg:flex items-center gap-2 hover:text-teal transition-colors">
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:inline">{user.email.split('@')[0]}</span>
                </button>
              } />
              <DropdownMenuContent align="end" className="w-56 rounded-none border-sage/20 shadow-xl">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-teal focus:text-white" onClick={() => window.location.href = '/account'}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-teal focus:text-white" onClick={() => window.location.href = '/account/orders'}>
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-teal focus:text-white" onClick={() => window.location.href = '/account/wishlist'}>
                    Wishlist
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 text-destructive focus:bg-destructive focus:text-white">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/account/login" className="hidden lg:block hover:text-teal transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link href="/account/wishlist" className="hidden lg:block hover:text-teal transition-colors relative">
            <Heart className="h-5 w-5" />
          </Link>

          <button className="hover:text-teal transition-colors relative" onClick={() => setIsOpen(true)}>
            <ShoppingBag className="h-5 w-5" />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-teal text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

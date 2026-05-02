'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, User, Menu, Heart, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { SearchModal } from '@/components/storefront/SearchModal';
import { StorefrontNotificationBell } from '@/components/layout/StorefrontNotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: 'Kurtas', href: '/products?category=kurtas' },
  { name: 'Sarees', href: '/products?category=sarees' },
  { name: 'Lehengas', href: '/products?category=lehengas' },
  { name: 'Suits', href: '/products?category=suits' },
  { name: 'Dupattas', href: '/products?category=dupattas' },
  { name: 'Fusion Wear', href: '/products?category=fusion-wear' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { getTotals, setIsOpen } = useCartStore();
  const { totalQuantity } = getTotals();
  const supabase = createClient();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/storefront/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
    setMounted(true);
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
    <header className="sticky top-0 z-50 w-full bg-[#1a3a34] border-b border-[#2d5a52] text-[#faf7f2]">
      <div className="px-4 md:px-8 h-14 md:h-16 flex items-center justify-between relative">

        {/* LEFT: Hamburger (mobile) + Desktop nav */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/10 text-[#faf7f2] h-9 w-9">
                <Menu className="h-6 w-6" />
              </Button>
            } />
            <SheetContent side="left" className="w-[300px] bg-[#1a3a34] p-0 border-r border-[#2d5a52]">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-[#2d5a52] text-[#faf7f2] font-serif tracking-widest text-lg">
                  {settings?.store_name || 'Store'}
                </div>
                <nav className="flex-1 py-2 overflow-y-auto">
                  <Link
                    href="/collections"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-6 py-4 text-xl border-b border-[#2d5a52] w-full text-center tracking-wider text-[#faf7f2]"
                  >
                    Collection
                  </Link>
                  <Link
                    href="/products?sort=newest"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-6 py-4 text-xl border-b border-[#2d5a52] w-full text-center tracking-wider text-[#faf7f2]"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    href="/products?discount=true"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-6 py-4 text-xl border-b border-[#2d5a52] w-full text-center tracking-wider text-red-400"
                  >
                    Sale
                  </Link>

                  {/* Collapsible Categories */}
                  <button
                    onClick={() => setMobileCatOpen(o => !o)}
                    className="flex items-center justify-center gap-2 px-6 py-4 text-xl border-b border-[#2d5a52] w-full text-center tracking-wider text-[#faf7f2]"
                  >
                    Categories
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileCatOpen && (
                    <div className="bg-[#132e28]">
                      {categories.map(cat => (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-10 py-3 text-base border-b border-[#2d5a52]/50 text-[#faf7f2]/80 hover:text-[#c9a84c] tracking-wide"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </nav>
                <div className="p-6 bg-[#132e28] space-y-4">
                  {user ? (
                    <>
                      <Link href="/account" className="flex items-center gap-3 text-xs font-bold tracking-widest text-[#faf7f2]" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4" /> My Account
                      </Link>
                      <Link href="/account/wishlist" className="flex items-center gap-3 text-xs font-bold tracking-widest text-[#faf7f2]" onClick={() => setMobileMenuOpen(false)}>
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 text-xs font-bold tracking-widest text-red-400">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/account/login" className="flex items-center gap-3 text-xs font-bold tracking-widest text-[#faf7f2]" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-4 h-4" /> Login / Signup
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/collections"
              className="text-xs tracking-[0.2em] font-medium text-[#faf7f2] hover:text-[#c9a84c] transition-colors"
            >
              Collection
            </Link>
            <Link
              href="/products?sort=newest"
              className="text-xs tracking-[0.2em] font-medium text-[#faf7f2] hover:text-[#c9a84c] transition-colors"
            >
              New Arrivals
            </Link>
            <Link
              href="/products?discount=true"
              className="text-xs tracking-[0.2em] font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Sale
            </Link>

            {/* Categories dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-xs tracking-[0.2em] font-medium text-[#faf7f2] hover:text-[#c9a84c] transition-colors">
                Categories <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg border border-[#e8e0d0] rounded z-50 py-2 hidden group-hover:block">
                {categories.map(cat => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="block px-4 py-2 text-sm text-[#1a3a34] hover:text-[#c9a84c] hover:bg-[#faf7f2]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* CENTER: Logo — absolutely centered */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings?.store_name || 'Store'} className="h-8 md:h-10 object-contain" />
          ) : (
            <Image
              src="/logo.png"
              alt={settings?.store_name || 'Store'}
              width={0}
              height={40}
              style={{ width: 'auto', height: '34px' }}
              className="object-contain"
              priority
            />
          )}
        </Link>

        {/* RIGHT: Icons — always visible */}
        <div className="flex items-center justify-end gap-2 md:gap-4 flex-1 text-[#faf7f2]">
          {/* Search — visible on all sizes */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-[#faf7f2]/80 hover:text-[#c9a84c] transition-colors p-2"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notification bell — only visible when logged in */}
          <StorefrontNotificationBell />

          {/* Account — desktop dropdown only */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="hidden md:flex items-center gap-2 text-[#faf7f2] hover:text-[#c9a84c] transition-colors">
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:inline">{user.email.split('@')[0]}</span>
                </button>
              } />
              <DropdownMenuContent align="end" className="w-56 rounded-none border-sage/20 shadow-xl">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-teal focus:text-white" onClick={() => window.location.href = '/account'}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-teal focus:text-white" onClick={() => window.location.href = '/account/orders'}>
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-teal focus:text-white" onClick={() => window.location.href = '/account/wink-points'}>
                    Wink Points
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
            <Link href="/account/login" className="hidden md:block text-[#faf7f2] hover:text-[#c9a84c] transition-colors p-2">
              <User className="h-5 w-5" />
            </Link>
          )}

          {/* Wishlist — desktop only (mobile via hamburger) */}
          <Link href="/account/wishlist" className="hidden md:block text-[#faf7f2] hover:text-[#c9a84c] transition-colors relative p-2">
            <Heart className="h-5 w-5" />
          </Link>

          {/* Cart — always visible */}
          <button
            className="text-[#faf7f2] hover:text-[#c9a84c] transition-colors relative p-2"
            onClick={() => setIsOpen(true)}
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {mounted && totalQuantity > 0 && (
              <span className="absolute top-0 right-0 bg-[#c9a84c] text-[#1a3a34] text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </div>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

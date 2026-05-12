'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search, ShoppingBag, User, Menu, Heart, LogOut, X
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { SearchModal } from '@/components/storefront/SearchModal';
import { LeafPattern } from '@/components/ui/LeafPattern';

const NAV_LINKS = [
  { href: '/products',    label: 'Shop' },
  { href: '/collections', label: 'Collections' },
  { href: '/about',       label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [settings, setSettings] = useState<any>({});
  const { getTotals, setIsOpen } = useCartStore();
  const { totalQuantity } = getTotals();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    fetch('/api/storefront/settings')
      .then(r => r.ok ? r.json() : {})
      .then(d => setSettings(d))
      .catch(() => {});

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        try {
          const res = await fetch('/api/storefront/wishlist');
          const d = await res.json();
          setWishlistCount(d.count || 0);
        } catch {}
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const iconBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px', borderRadius: '0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color 150ms',
    position: 'relative',
  };

  return (
    <>
      <header className="bg-[#1C3829] text-white shadow-md w-full">
        <LeafPattern opacity={0.05} id="header" />
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* LEFT: Logo */}
          <Link href="/">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="LabelWink"
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* CENTER: Desktop Nav */}
          <nav className="hidden md:flex gap-8 items-center">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={`text-white/80 hover:text-labelwink-gold transition-colors duration-200 text-xs font-bold uppercase tracking-widest ${
                  isActive(link.href) ? 'text-labelwink-gold underline underline-offset-8 decoration-2' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="text-white hover:text-labelwink-gold transition-colors duration-200 relative p-2"
            >
              <Search size={20} />
            </button>

            {/* Wishlist (desktop) */}
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="hidden md:flex text-white hover:text-[#c9a84c] transition-colors duration-200 relative p-2"
            >
              <Heart size={20} />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-labelwink-gold text-labelwink-green text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Cart"
              className="text-white hover:text-[#c9a84c] transition-colors duration-200 relative p-2"
            >
              <ShoppingBag size={20} />
              {mounted && totalQuantity > 0 && (
                <span className="absolute top-0 right-0 bg-labelwink-gold text-labelwink-green text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalQuantity > 9 ? '9+' : totalQuantity}
                </span>
              )}
            </button>

            {/* Account (desktop) */}
            <div className="hidden md:block">
              <Link
                href={user ? '/account' : '/account/login'}
                className="text-white hover:text-[#c9a84c] transition-colors duration-200 relative p-2 block"
              >
                <User size={20} />
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden text-white hover:text-labelwink-gold transition-colors duration-200 relative p-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(26,46,30,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#1C3829] flex flex-col border-r border-[#E8DFC8] animate-slide-in-left">
            {/* Header */}
            <div className="p-5 border-b border-[#E8DFC8]/20 flex items-center justify-between">
              <span className="text-xl font-bold text-white tracking-widest uppercase">
                LABEL WINK
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/60 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-2 overflow-y-auto">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center h-14 px-6 text-xs font-bold uppercase tracking-widest transition-colors ${
                    isActive(link.href) ? 'bg-white/10 text-labelwink-gold border-l-4 border-labelwink-gold' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="p-5 border-t border-white/10 flex flex-col gap-3 bg-[#1A330B]">
              {user ? (
                <>
                  <Link href="/account" className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
                    <User size={16} /> My Account
                  </Link>
                  <Link href="/account/wishlist" className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
                    <Heart size={16} /> Wishlist
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/account/login"
                  className="bg-labelwink-gold text-labelwink-green font-bold px-4 py-3 rounded-none hover:bg-labelwink-gold/90 transition-colors duration-200 flex items-center justify-center h-12 w-full uppercase tracking-widest text-xs shadow-lg"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

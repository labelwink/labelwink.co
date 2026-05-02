'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, ArrowRight, MessageCircle, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function Footer({ 
  columns = [], 
  social = {}, 
  tagline = "GRACE IN EVERY THREAD" 
}: { 
  columns?: any[], 
  social?: any, 
  tagline?: string 
}) {
  const [settings, setSettings] = useState<any>({});
  const [openSection, setOpenSection] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetch('/api/storefront/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const whatsapp = settings.social_links?.whatsapp || settings.store_phone;
  const email = settings.store_email || '';

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  return (
    <footer className="bg-[#1a3a34] text-[#faf7f2] pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 mb-8">
          {/* Brand & Newsletter — always visible */}
          <div className="lg:col-span-1 space-y-4 mb-8 md:mb-0">
            <div>
              <p className="text-[#faf7f2] font-serif tracking-widest text-lg mb-1">{settings?.store_name || 'Store'}</p>
              <p className="text-[#c9a84c]/70 text-xs" style={{ letterSpacing: '0.15em' }}>
                {settings?.store_tagline || tagline}
              </p>
            </div>
            <p className="text-xs text-[#faf7f2]/60 leading-relaxed max-w-[200px]">
              Curated ethnic &amp; fusion wear for the modern Indian woman. Every piece is handcrafted with love and meticulous detail in the heart of India.
            </p>
            {settings?.free_shipping_threshold && (
              <p className="text-xs text-[#c9a84c] mt-2 font-bold">
                Free shipping on orders above ₹{settings.free_shipping_threshold}
              </p>
            )}
            <div className="space-y-2 pt-4 border-t border-[#2d5a52]">
              <h3 className="text-xs font-bold tracking-widest text-[#c9a84c]">Join The Wink Club</h3>
              <p className="text-[10px] text-[#faf7f2]/60 tracking-wider">Unlock exclusive deals and new arrivals!</p>
              <form className="flex gap-0 mt-4" onSubmit={(e) => e.preventDefault()}>
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-transparent border-[#2d5a52] text-[#faf7f2] placeholder:text-[#faf7f2]/40 focus-visible:ring-[#c9a84c] focus-visible:border-[#c9a84c] rounded-none h-10 text-xs"
                />
                <Button type="submit" className="bg-[#c9a84c] text-[#1a3a34] hover:bg-[#c9a84c]/90 rounded-none h-10 px-4">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Collections — accordion on mobile */}
          <div className="border-t border-[#2d5a52] md:border-0">
            <button
              className="flex w-full items-center justify-between py-3 md:hidden"
              onClick={() => toggleSection('collections')}
              aria-expanded={openSection === 'collections'}
            >
              <span className="text-[#c9a84c] tracking-[0.2em] text-xs font-medium">Collections</span>
              <ChevronDown size={16} className={`text-[#faf7f2]/60 transition-transform duration-200 ${openSection === 'collections' ? 'rotate-180' : ''}`} />
            </button>
            <h3 className="hidden md:block text-[#c9a84c] tracking-[0.2em] text-xs border-b border-[#2d5a52] pb-3 mb-3">Collections</h3>
            <ul className={`space-y-2 text-[10px] font-bold tracking-widest text-[#faf7f2]/70 pb-3 md:pb-0 ${openSection === 'collections' ? 'block' : 'hidden'} md:block`}>
              <li><Link href="/products" className="hover:text-[#c9a84c] transition-colors block py-1">All Products</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-[#c9a84c] transition-colors block py-1">New Arrivals</Link></li>
              <li><Link href="/products?sort=bestseller" className="hover:text-[#c9a84c] transition-colors block py-1">Best Sellers</Link></li>
            </ul>
          </div>

          {/* Customer Care — accordion on mobile */}
          <div className="border-t border-[#2d5a52] md:border-0">
            <button
              className="flex w-full items-center justify-between py-3 md:hidden"
              onClick={() => toggleSection('customer-care')}
              aria-expanded={openSection === 'customer-care'}
            >
              <span className="text-[#c9a84c] tracking-[0.2em] text-xs font-medium">Customer Care</span>
              <ChevronDown size={16} className={`text-[#faf7f2]/60 transition-transform duration-200 ${openSection === 'customer-care' ? 'rotate-180' : ''}`} />
            </button>
            <h3 className="hidden md:block text-[#c9a84c] tracking-[0.2em] text-xs border-b border-[#2d5a52] pb-3 mb-3">Customer Care</h3>
            <ul className={`space-y-2 text-[10px] font-bold tracking-widest text-[#faf7f2]/70 pb-3 md:pb-0 ${openSection === 'customer-care' ? 'block' : 'hidden'} md:block`}>
              <li><Link href="/about" className="hover:text-[#c9a84c] transition-colors block py-1">Our Story</Link></li>
              <li><Link href="/faq" className="hover:text-[#c9a84c] transition-colors block py-1">FAQ</Link></li>
              <li><Link href="/size-guide" className="hover:text-[#c9a84c] transition-colors block py-1">Size Guide</Link></li>
              <li><Link href="/contact" className="hover:text-[#c9a84c] transition-colors block py-1">Contact Us</Link></li>
              <li><Link href="/policy/shipping-policy" className="hover:text-[#c9a84c] transition-colors block py-1">Shipping &amp; Returns</Link></li>
              <li><Link href="/policy/privacy-policy" className="hover:text-[#c9a84c] transition-colors block py-1">Privacy Policy</Link></li>
              <li><Link href="/policy/return-refund-policy" className="hover:text-[#c9a84c] transition-colors block py-1">Return Policy</Link></li>
              <li><Link href="/policy/terms-and-conditions" className="hover:text-[#c9a84c] transition-colors block py-1">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact & Social — accordion on mobile */}
          <div className="border-t border-[#2d5a52] md:border-0">
            <button
              className="flex w-full items-center justify-between py-3 md:hidden"
              onClick={() => toggleSection('contact')}
              aria-expanded={openSection === 'contact'}
            >
              <span className="text-[#c9a84c] tracking-[0.2em] text-xs font-medium">Contact</span>
              <ChevronDown size={16} className={`text-[#faf7f2]/60 transition-transform duration-200 ${openSection === 'contact' ? 'rotate-180' : ''}`} />
            </button>
            <h3 className="hidden md:block text-[#c9a84c] tracking-[0.2em] text-xs border-b border-[#2d5a52] pb-3 mb-3">Contact</h3>
            <div className={`space-y-6 pb-3 md:pb-0 ${openSection === 'contact' ? 'block' : 'hidden'} md:block`}>
              <div className="space-y-1">
                <p className="text-[10px] tracking-widest text-[#c9a84c] font-bold">Email us</p>
                <a href={`mailto:${email}`} className="text-xs text-[#faf7f2]/70 hover:text-[#c9a84c] transition-colors">{email}</a>
              </div>
              {whatsapp && (
                <div className="space-y-1">
                  <p className="text-[10px] tracking-widest text-[#c9a84c] font-bold">WhatsApp Support</p>
                  <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 text-xs text-[#faf7f2]/70 hover:text-[#c9a84c] transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-500" /> {whatsapp}
                  </a>
                </div>
              )}
              {settings.store_address && (
                <div className="space-y-1">
                  <p className="text-[10px] tracking-widest text-[#c9a84c] font-bold">Visit Us</p>
                  <p className="text-xs text-[#faf7f2]/70 leading-relaxed">
                    {settings.store_address}<br/>
                    {settings.store_city}, {settings.store_state} {settings.store_pincode}
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 pt-2">
                {settings.social_links?.instagram && (
                  <a href={settings.social_links.instagram} target="_blank" className="w-8 h-8 rounded-full border border-[#faf7f2]/20 flex items-center justify-center text-[#faf7f2]/60 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {settings.social_links?.facebook && (
                  <a href={settings.social_links.facebook} target="_blank" className="w-8 h-8 rounded-full border border-[#faf7f2]/20 flex items-center justify-center text-[#faf7f2]/60 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#132e28] -mx-4 px-4 mt-6 border-t border-[#2d5a52]/50">
          <div className="container mx-auto py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[9px] font-bold tracking-[0.3em] text-[#faf7f2]/40 text-center md:text-left flex items-center gap-4">
              &copy; {new Date().getFullYear()} {settings?.store_name || 'Store'}. All rights reserved.
              <Link href="/admin" className="hover:text-[#c9a84c] transition-colors underline">Admin</Link>
            </div>
            {/* Payment Badges */}
            <div className="flex flex-wrap justify-center md:justify-end gap-2 text-[#faf7f2]/40 text-xs">
              <span className="border border-[#faf7f2]/20 rounded px-2 py-1">VISA</span>
              <span className="border border-[#faf7f2]/20 rounded px-2 py-1">MASTERCARD</span>
              <span className="border border-[#faf7f2]/20 rounded px-2 py-1">UPI</span>
              <span className="border border-[#faf7f2]/20 rounded px-2 py-1">RAZORPAY</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

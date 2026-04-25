'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Mail, ArrowRight, MessageCircle } from 'lucide-react';
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
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc: any, s: any) => ({
          ...acc,
          [s.key]: s.value
        }), {});
        setSettings(settingsMap);
      }
    }
    fetchSettings();
  }, []);

  const whatsapp = settings.whatsapp_number?.number;
  const email = settings.store_email?.email || 'hello@labelwink.in';

  return (
    <footer className="bg-charcoal text-cream pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <p className="text-brand-wordmark text-white mb-2">LABEL WINK</p>
              <p className="text-eyebrow text-white/40 text-[10px]" style={{ letterSpacing: '0.15em' }}>
                {tagline}
              </p>
            </div>
            <p className="text-sm text-cream/70 leading-relaxed font-medium">
              Curated ethnic & fusion wear for the modern Indian woman. Every piece is handcrafted with love and meticulous detail in the heart of India.
            </p>
            <div className="space-y-4 pt-4 border-t border-cream/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal">Join The Wink Club</h3>
              <p className="text-[10px] text-cream/60 uppercase tracking-wider">Unlock exclusive deals and new arrivals!</p>
              <form className="flex gap-0" onSubmit={(e) => e.preventDefault()}>
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-transparent border-cream/20 text-cream placeholder:text-cream/40 focus-visible:ring-teal focus-visible:border-teal rounded-none h-12 text-xs"
                />
                <Button type="submit" className="bg-teal text-cream hover:bg-teal/90 rounded-none h-12 px-6">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h3 className="font-heading text-xl tracking-widest uppercase border-b border-cream/10 pb-4">Collections</h3>
            <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-cream/60">
              <li><Link href="/collections/all" className="hover:text-teal transition-colors">All Products</Link></li>
              <li><Link href="/collections/new-arrivals" className="hover:text-teal transition-colors">New Arrivals</Link></li>
              <li><Link href="/collections/best-sellers" className="hover:text-teal transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h3 className="font-heading text-xl tracking-widest uppercase border-b border-cream/10 pb-4">Customer Care</h3>
            <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-cream/60">
              <li><Link href="/about" className="hover:text-teal transition-colors">Our Story</Link></li>
              <li><Link href="/faq" className="hover:text-teal transition-colors">FAQ</Link></li>
              <li><Link href="/size-guide" className="hover:text-teal transition-colors">Size Guide</Link></li>
              <li><Link href="/contact" className="hover:text-teal transition-colors">Contact Us</Link></li>
              <li><Link href="/policy/shipping-policy" className="hover:text-teal transition-colors">Shipping &amp; Returns</Link></li>
              <li><Link href="/policy/privacy-policy" className="hover:text-teal transition-colors">Privacy Policy</Link></li>
              <li><Link href="/policy/return-refund-policy" className="hover:text-teal transition-colors">Return Policy</Link></li>
              <li><Link href="/policy/terms-and-conditions" className="hover:text-teal transition-colors">Terms of Service</Link></li>
            </ul>
          </div>


          {/* Contact & Social */}
          <div className="space-y-8">
            <h3 className="font-heading text-xl tracking-widest uppercase border-b border-cream/10 pb-4">Contact</h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-teal font-bold">Email us</p>
                <a href={`mailto:${email}`} className="text-sm font-medium hover:text-teal transition-colors">{email}</a>
              </div>
              {whatsapp && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-teal font-bold">WhatsApp Support</p>
                  <a href={`https://wa.me/91${whatsapp}`} className="flex items-center gap-2 text-sm font-medium hover:text-teal transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-500" /> +91 {whatsapp}
                  </a>
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <a href="https://instagram.com/labelwink" target="_blank" className="h-10 w-10 border border-cream/10 flex items-center justify-center hover:bg-teal hover:border-teal transition-all">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://facebook.com/labelwink" target="_blank" className="h-10 w-10 border border-cream/10 flex items-center justify-center hover:bg-teal hover:border-teal transition-all">
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/10 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-cream/40 text-center md:text-left flex items-center gap-4">
            &copy; {new Date().getFullYear()} LABEL WINK. All rights reserved.
            <Link href="/admin" className="hover:text-teal transition-colors underline">Admin</Link>
          </div>
          
          {/* Payment Icons */}
          <div className="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            <Image src="https://upload.wikimedia.org/wikipedia/commons/2/24/Visa_2014_logo_detail.svg" alt="Visa" width={36} height={12} loading="lazy" />
            <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={40} height={20} loading="lazy" />
            <Image src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" width={40} height={16} loading="lazy" className="bg-white px-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, ArrowRight, ChevronDown } from 'lucide-react';
import { LeafPattern } from '@/components/ui/LeafPattern';

const COLUMNS = [
  {
    id: 'collections',
    title: 'COLLECTIONS',
    links: [
      { href: '/products', label: 'All Products' },
      { href: '/products?sort=newest', label: 'New Arrivals' },
      { href: '/collections', label: 'Collections' },
    ],
  },
  {
    id: 'care',
    title: 'CUSTOMER CARE & POLICIES',
    links: [
      { href: '/about', label: 'Our Story' },
      { href: '/faqs', label: 'FAQ' },
      { href: '/size-guide', label: 'Size Guide' },
      { href: '/shipping-policy', label: 'Shipping Policy' },
      { href: '/return-exchange-policy', label: 'Return & Exchanges' },
      { href: '/refund-policy', label: 'Refund Policy' },
      { href: '/cancellation-policy', label: 'Cancellations' },
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/terms-conditions', label: 'Terms & Conditions' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
];

function FooterColumn({ id, title, links }: { id: string; title: string; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* DESKTOP — always expanded, no toggle */}
      <div className="hidden md:block">
        <h4 className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-5">
          {title}
        </h4>
        <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {links.map(link => (
            <li key={link.href + link.label}>
              <Link href={link.href} className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors text-sm block">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* MOBILE — collapsible */}
      <div className="md:hidden border-b border-white/10">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full py-4 bg-transparent border-none cursor-pointer"
        >
          <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider">
            {title}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: '#6a8a72',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms',
            }}
          />
        </button>
        {open && (
          <ul className="space-y-3 pb-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {links.map(link => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors text-sm block">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function Footer(_props?: { columns?: any[]; social?: any; tagline?: string }) {
  const [settings, setSettings] = useState<any>({});
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch('/api/storefront/settings')
      .then(r => r.ok ? r.json() : {})
      .then(d => setSettings(d))
      .catch(() => { });
  }, []);

  const storeEmail = settings.legal?.support_email || settings.store_email || 'Support@labelwink.co';
  const socialLinks = {
    instagram: 'https://www.instagram.com/labelwink/',
    facebook: settings.social_links?.facebook,
    ...settings.social_links
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailSent(true);
    setEmail('');
  };

  return (
    <footer className="relative bg-[#1C3829] text-white border-t border-white/5">
      <LeafPattern opacity={0.06} id="footer" />
      
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-12 py-12 px-8 lg:px-12">
          
          {/* LEFT SIDE: Shop Information (Logo, GST, Legal Entity, Grievance) */}
          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <div className="mb-2">
              <Image
                src="/logo.png"
                alt="Label Wink"
                width={160}
                height={56}
                className="h-14 w-auto object-contain"
              />
            </div>
            
            <div className="text-sm text-[#9aab9e] space-y-4 leading-relaxed">
              <p>
                <strong className="text-[#c9a84c] block mb-1 font-medium text-base">
                  {settings.legal?.legal_entity_name || 'LabelWink Pvt Ltd'}
                </strong>
                {settings.legal?.registered_address || '123 Fashion Street, Bandra West, Mumbai, Maharashtra – 400050 | India'}
              </p>
              
              <p className="flex flex-col gap-1">
                <span>GSTIN: <span className="text-white/90">{settings.legal?.gstin || '27AABCT3518Q1Z4'}</span></span>
                {settings.legal?.cin && (
                  <span>CIN: <span className="text-white/90">{settings.legal.cin}</span></span>
                )}
              </p>
              
              <div className="pt-2 border-t border-white/10">
                <strong className="text-[#c9a84c] block mb-1 font-medium">
                  {settings.legal?.grievance_officer_designation || 'Grievance Officer'}: {settings.legal?.grievance_officer_name || 'SHIVA SHAKKTHI'}
                </strong>
                <a href={`mailto:${settings.legal?.grievance_officer_email || 'help@labelwink.co'}`} className="hover:text-white transition-colors block">
                  {settings.legal?.grievance_officer_email || 'help@labelwink.co'}
                </a>
                <span className="block mt-1">
                  {settings.legal?.grievance_officer_phone || '+91 9876543210'}
                </span>
                <span className="text-xs text-[#6a8a72] mt-2 block">
                  Response within {settings.legal?.grievance_acknowledgement_sla || '48 hours'}
                </span>
              </div>
              
              <p className="text-xs text-[#6a8a72] pt-2">
                As per Consumer Protection (E-Commerce) Rules, 2020 & IT Rules, 2021
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Links & Contact */}
          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Collections */}
            <FooterColumn id="collections" title="COLLECTIONS" links={COLUMNS[0].links} />

            {/* Column 2: Customer Care & Policies */}
            <FooterColumn id="care" title="CUSTOMER CARE & POLICIES" links={COLUMNS[1].links} />

            {/* Column 3: Contact & Newsletter */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div>
                <h4 className="hidden md:block text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-5">
                  CONTACT
                </h4>
                <ContactMobileSection email={storeEmail} socialLinks={socialLinks} />
                
                <div className="hidden md:block space-y-4">
                  <div>
                    <p className="text-[11px] text-[#6a8a72] uppercase tracking-widest mb-1">EMAIL US</p>
                    <a href={`mailto:${storeEmail}`} className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors text-sm">
                      {storeEmail}
                    </a>
                  </div>
                  
                  {/* Social Icons */}
                  <div className="flex gap-3 pt-2">
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                        <Instagram size={18} />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                        <Facebook size={18} />
                      </a>
                    )}
                    {!socialLinks.instagram && !socialLinks.facebook && (
                      <>
                        <div className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"><Instagram size={18} /></div>
                        <div className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"><Facebook size={18} /></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c9a84c] mb-1">
                  JOIN THE WINK CLUB
                </p>
                <p className="text-[11px] text-[#6a8a72] uppercase tracking-wide mb-3">
                  UNLOCK EXCLUSIVE DEALS AND NEW ARRIVALS!
                </p>

                {emailSent ? (
                  <p className="text-[13px] text-[#c9a84c]">✓ You&apos;re on the list!</p>
                ) : (
                  <form onSubmit={handleNewsletter} className="flex max-w-[280px]">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 h-12 bg-white/5 border border-white/10 border-r-0 rounded-l-lg px-4 text-[13px] text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 bg-[#c9a84c] hover:bg-[#e0bc5a] text-[#1e3d29] rounded-r-lg flex items-center justify-center transition-colors shrink-0"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar - End Credits */}
      <div className="border-t border-white/10 bg-[#152a1e]">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6a8a72]">
          <p className="m-0 tracking-wider text-center md:text-left">
            © {new Date().getFullYear()} LABEL WINK. ALL RIGHTS RESERVED.
          </p>

          <p className="m-0 tracking-wider uppercase text-center">
            Developed & Maintained by <a href="https://hawklab.in" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#e0bc5a] transition-colors font-medium">HAWKLAB.in</a>
          </p>

          {/* Payment badges */}
          <div className="flex gap-2 flex-wrap justify-center">
            {['VISA', 'MASTERCARD', 'UPI', 'RAZORPAY'].map(badge => (
              <span key={badge} className="border border-white/10 bg-white/5 px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-medium text-[#9aab9e]">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function ContactMobileSection({ email, socialLinks }: { email: string; socialLinks: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden border-b border-white/10 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 bg-transparent border-none cursor-pointer"
      >
        <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider">
          CONTACT
        </span>
        <ChevronDown size={16} style={{ color: '#6a8a72', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
      </button>
      {open && (
        <div className="pb-4 space-y-4">
          <div>
            <p className="text-[11px] text-[#6a8a72] uppercase tracking-widest mb-1">EMAIL US</p>
            <a href={`mailto:${email}`} className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors text-sm">
              {email}
            </a>
          </div>
          <div className="flex gap-3">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                <Instagram size={18} />
              </a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[#9aab9e] hover:text-[#c9a84c] transition-colors w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                <Facebook size={18} />
              </a>
            )}
            {!socialLinks.instagram && !socialLinks.facebook && (
              <>
                <div className="text-[#9aab9e] w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"><Instagram size={18} /></div>
                <div className="text-[#9aab9e] w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"><Facebook size={18} /></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

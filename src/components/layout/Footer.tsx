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
    title: 'CUSTOMER CARE',
    links: [
      { href: '/about', label: 'Our Story' },
      { href: '/faq', label: 'FAQ' },
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
        <h4 className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
          {title}
        </h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {links.map(link => (
            <li key={link.href + link.label}>
              <Link href={link.href} className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm block">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* MOBILE — collapsible */}
      <div className="md:hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '16px 0',
          }}
        >
          <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
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
          <ul style={{
            listStyle: 'none',
            padding: '0 0 16px',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {links.map(link => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm block">
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

// Footer accepts (and ignores) legacy props passed from layout.tsx for backwards compatibility
export function Footer(_props?: { columns?: any[]; social?: any; tagline?: string }) {
  const [settings, setSettings] = useState<any>({});
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch('/api/storefront/settings')
      .then(r => r.ok ? r.json() : {})
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  const storeEmail = settings.store_email || 'hello@labelwink.com';
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
      {/* Main grid */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10 px-8">

          {/* Column 1 — Brand */}
          <div>
            {/* Logo */}
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Label Wink"
                width={160}
                height={56}
                className="h-14 w-auto object-contain mb-3"
              />
            </div>
            <p style={{
              fontStyle: 'italic',
              color: '#c9a84c',
              fontSize: '14px',
              margin: '0 0 16px',
            }}>
              Wear Wink
            </p>
            <p style={{
              fontSize: '14px',
              color: '#9aab9e',
              lineHeight: 1.7,
              maxWidth: '240px',
              margin: '0 0 24px',
            }}>
              Curated ethnic & fusion wear for the modern Indian woman. Every piece is handcrafted with love and meticulous detail in the heart of India.
            </p>

            {/* Newsletter */}
            <div>
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#c9a84c',
                margin: '0 0 4px',
              }}>
                JOIN THE WINK CLUB
              </p>
              <p style={{
                fontSize: '11px',
                color: '#6a8a72',
                margin: '0 0 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                UNLOCK EXCLUSIVE DEALS AND NEW ARRIVALS!
              </p>

              {emailSent ? (
                <p style={{ fontSize: '13px', color: '#c9a84c' }}>✓ You&apos;re on the list!</p>
              ) : (
                <form onSubmit={handleNewsletter} style={{ display: 'flex' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      flex: 1,
                      height: '48px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRight: 'none',
                      borderRadius: '8px 0 0 8px',
                      padding: '0 16px',
                      fontSize: '13px',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: '#c9a84c',
                      border: 'none',
                      borderRadius: '0 8px 8px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1e3d29',
                      transition: 'background 150ms',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e0bc5a')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#c9a84c')}
                  >
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 2 — Collections */}
          <FooterColumn id="collections" title="COLLECTIONS" links={COLUMNS[0].links} />

          {/* Column 3 — Customer Care */}
          <FooterColumn id="care" title="CUSTOMER CARE" links={COLUMNS[1].links} />

          {/* Column 4 — Contact */}
          <div>
            {/* Desktop heading */}
            <h4 className="hidden md:block text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
              CONTACT
            </h4>

            {/* Mobile collapsible heading for Contact */}
            <ContactMobileSection email={storeEmail} socialLinks={socialLinks} />

            {/* Desktop contact content */}
            <div className="hidden md:block">
              <p style={{
                fontSize: '11px',
                color: '#6a8a72',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 8px',
              }}>
                EMAIL US
              </p>
              <a
                href={`mailto:${storeEmail}`}
                className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm block"
              >
                {storeEmail}
              </a>

              {/* Social icons */}
              <div className="mt-6 flex gap-3">
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#c9a84c] transition-colors w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                    <Instagram size={16} />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#c9a84c] transition-colors w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                    <Facebook size={16} />
                  </a>
                )}
                {/* Always show Instagram placeholder if no links configured */}
                {!socialLinks.instagram && !socialLinks.facebook && (
                  <>
                    <div className="text-white/60 hover:text-[#c9a84c] transition-colors w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center"><Instagram size={16} /></div>
                    <div className="text-white/60 hover:text-[#c9a84c] transition-colors w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center"><Facebook size={16} /></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 text-white/50 text-xs flex flex-wrap items-center justify-between gap-3 px-8 py-4">
        <p className="m-0 tracking-wider">
          © {new Date().getFullYear()} LABEL WINK. ALL RIGHTS RESERVED.
        </p>

        {/* Payment badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['VISA', 'MASTERCARD', 'UPI', 'RAZORPAY'].map(badge => (
            <span key={badge} style={{
              border: '1px solid #4a6a52',
              color: '#6a8a72',
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

// Separate mobile-only collapsible for Contact column
function ContactMobileSection({ email, socialLinks }: { email: string; socialLinks: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '16px 0',
        }}
      >
        <span className="text-[#c9a84c] font-semibold text-sm uppercase tracking-wider mb-3">
          CONTACT
        </span>
        <ChevronDown size={16} style={{ color: '#6a8a72', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
      </button>
      {open && (
        <div style={{ paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '11px', color: '#6a8a72', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>EMAIL US</p>
          <a href={`mailto:${email}`} className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm block">
            {email}
          </a>
          <div className="mt-2 flex gap-3">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#c9a84c] transition-colors w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                <Instagram size={16} />
              </a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#c9a84c] transition-colors w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                <Facebook size={16} />
              </a>
            )}
            {!socialLinks.instagram && !socialLinks.facebook && (
              <>
                <div className="text-white/60 w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center"><Instagram size={16} /></div>
                <div className="text-white/60 w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center"><Facebook size={16} /></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Coins, Instagram, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WinkPointsPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center space-y-8 p-8 md:p-12 bg-white border border-[#E8DFC8] rounded-3xl shadow-md relative overflow-hidden">
        {/* Decorative subtle patterns */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-full blur-xl -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#1C3829]/5 rounded-full blur-xl -ml-12 -mb-12" />

        <div className="relative z-10 space-y-6">
          {/* Coins Badge */}
          <div className="mx-auto w-16 h-16 bg-[#FAF5E9] border border-[#E8DFC8] text-[#c9a84c] rounded-full flex items-center justify-center shadow-inner">
            <Coins className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[9px] tracking-[0.25em] font-extrabold text-[#c9a84c] uppercase block">
              Loyalty Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-heading font-semibold text-[#1C3829]">
              Wink Points
            </h1>
            <div className="w-12 h-[2px] bg-[#c9a84c] mx-auto my-3" />
            <p className="text-xs md:text-sm text-[#6B6B5A] italic max-w-sm mx-auto leading-relaxed">
              We are fine-tuning our loyalty points engine to bring you exclusive shopping rewards. Stay tuned for exciting point adjustments and dynamic conversion rates!
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2.5 pt-4 max-w-xs mx-auto">
            {/* Instagram Link */}
            <a 
              href="https://www.instagram.com/labelwink/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full h-11 bg-[#1C3829] text-white rounded-full text-xs font-bold hover:bg-[#16312b] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              <Instagram className="w-4 h-4 text-[#c9a84c]" /> Follow us on Instagram
            </a>

            {/* Back to Products */}
            <Link 
              href="/products" 
              className="w-full h-11 border border-[#E8DFC8] text-[#1C3829] rounded-full text-xs font-bold hover:border-[#1C3829] transition-all flex items-center justify-center gap-1.5 bg-transparent"
            >
              Start Browsing <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

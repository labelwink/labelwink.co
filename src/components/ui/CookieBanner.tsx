'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lw_cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lw_cookie_consent', 'accepted');
    setVisible(false);
    // TODO: Initialize analytics/tracking scripts here only after consent
  };

  const handleDecline = () => {
    localStorage.setItem('lw_cookie_consent', 'declined');
    setVisible(false);
    // TODO: Ensure analytics are NOT initialized
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-950 border-t border-gray-700 px-4 py-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          🍪 We use essential and analytics cookies to improve your experience on LabelWink.
          By clicking <strong>Accept</strong>, you consent to our use of cookies as described in our{' '}
          <Link href="/privacy-policy" className="underline text-white hover:text-gray-200">
            Privacy Policy
          </Link>
          {' '}(compliant with DPDP Act, 2023).
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-5 py-2 text-sm border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2 text-sm bg-white text-black font-semibold rounded-md hover:bg-gray-100 transition"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

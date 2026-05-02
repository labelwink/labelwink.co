'use client';

import { useEffect } from 'react';

export default function PrintButton({ label = '🖨️ Print Invoice' }: { label?: string }) {
  return (
    <div className="no-print flex gap-3 mb-6">
      <button onClick={() => window.print()} className="bg-[#c9a84c] text-[#1a1a1a] font-bold px-6 py-2 rounded-lg">
        {label}
      </button>
      <button onClick={() => window.history.back()} className="border border-gray-300 px-6 py-2 rounded-lg">
        ← Back
      </button>
    </div>
  );
}

import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import SuccessContent from './SuccessContent';

export const metadata = {
  title: 'Order Success | LabelWink',
};

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-[#016a6e] mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-[#1a3a34]/60">Processing your order…</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

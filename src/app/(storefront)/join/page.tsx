import { Suspense } from 'react';
import JoinContent from './JoinContent';

export const metadata = {
  title: 'Join the Club | LabelWink',
};

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <JoinContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';

interface WriteReviewFormProps {
  productId: string;
  isLoggedIn: boolean;
}

export default function WriteReviewForm({ productId, isLoggedIn }: WriteReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="mt-8 p-5 bg-sage/5 border border-sage/20 rounded-xl text-sm text-charcoal/70">
        <Link href="/account/login" className="text-teal font-semibold hover:underline">Login</Link> to write a review.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    setResult(null);

    const res = await fetch('/api/storefront/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, rating, title, review_body: body }),
    });
    const data = await res.json();

    if (res.ok) {
      setResult({ success: true });
      setRating(0);
      setTitle('');
      setBody('');
    } else if (res.status === 403) {
      setResult({ error: 'Purchase this product to write a review.' });
    } else {
      setResult({ error: data.error || 'Failed to submit review.' });
    }
    setSubmitting(false);
  };

  if (result?.success) {
    return (
      <div className="mt-8 p-5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
        ✓ Thanks! Your review is pending approval and will appear soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 bg-white border border-sage/20 rounded-xl p-6">
      <h3 className="font-heading text-lg font-semibold text-charcoal">Write a Review</h3>

      {/* Star selector */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${i <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-1 block">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full border border-sage/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-1 block">Review</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          placeholder="What did you like or dislike? How was the fit?"
          className="w-full border border-sage/20 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      {result?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{result.error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !rating}
        className="bg-charcoal text-cream text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-none hover:bg-teal transition-colors disabled:opacity-50 w-full"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

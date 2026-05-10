'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2, CheckCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  size?: string;
  quantity: number;
  product_image?: string;
}

interface ReturnModalProps {
  orderId: string;
  items: OrderItem[];
  onSuccess: () => void;
  onClose: () => void;
}

const RETURN_REASONS = [
  { value: 'wrong_size', label: 'Wrong size' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'not_as_described', label: 'Different from description' },
  { value: 'damaged', label: 'Damaged / Defective' },
  { value: 'changed_mind', label: 'Changed my mind' },
];

export function ReturnModal({ orderId, items, onSuccess, onClose }: ReturnModalProps) {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || images.length >= 3) return;

    setUploading(true);
    for (let i = 0; i < Math.min(files.length, 3 - images.length); i++) {
      const formData = new FormData();
      formData.append('file', files[i]);

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          setImages(prev => [...prev, data.url]);
        }
      } catch {
        // silently skip failed uploads
      }
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/storefront/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          items: selectedItems,
          reason,
          description,
          images,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center" onClick={e => e.stopPropagation()}>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-charcoal mb-2">Return Request Submitted!</h3>
          <p className="text-sm text-muted-foreground">We&apos;ll contact you within 24 hours with next steps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sage/10 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg font-bold text-charcoal">Request Return</h2>
          <button onClick={onClose} className="p-1 hover:bg-sage/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s ? 'bg-[#c9a84c] text-white' : 'bg-sage/10 text-muted-foreground'
                }`}>
                  {s}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-charcoal' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Items' : s === 2 ? 'Reason' : 'Details'}
                </span>
                {s < 3 && <div className="flex-1 h-px bg-sage/20" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select items */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Select the items you wish to return:</p>
              {items.map(item => {
                const isChecked = selectedItems.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                      isChecked ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-sage/20 hover:border-sage/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 text-[#c9a84c] rounded border-sage/30 focus:ring-[#c9a84c]"
                    />
                    {item.product_image && (
                      <div className="w-12 h-12 relative flex-shrink-0">
                        <Image 
                          src={item.product_image} 
                          alt="" 
                          fill
                          sizes="48px"
                          className="rounded-lg object-cover" 
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm text-charcoal">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size && `Size: ${item.size}`} · Qty: {item.quantity}
                      </p>
                    </div>
                  </label>
                );
              })}
              <button
                onClick={() => setStep(2)}
                disabled={selectedItems.length === 0}
                className="w-full mt-4 py-3 bg-white text-white rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-black transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Select reason */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Why are you returning?</p>
              {RETURN_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                    reason === r.value ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-sage/20 hover:border-sage/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="w-4 h-4 text-[#c9a84c] border-sage/30 focus:ring-[#c9a84c]"
                  />
                  <span className="text-sm font-medium text-charcoal">{r.label}</span>
                </label>
              ))}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-sage/20 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-sage/5 transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!reason}
                  className="flex-1 py-3 bg-white text-white rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-black transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Description + Photos */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Additional Details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us more about the issue..."
                  className="w-full border border-sage/30 rounded-lg text-sm p-3 h-24 resize-none outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Upload Photos (up to 3)
                </label>
                <div className="flex gap-3 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-sage/20">
                      <Image 
                        src={img} 
                        alt="" 
                        fill
                        sizes="80px"
                        className="object-cover" 
                      />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="w-20 h-20 border-2 border-dashed border-sage/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#c9a84c] transition-colors">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground mt-1">Add</span>
                        </>
                      )}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-sage/20 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-sage/5 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-red-700 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Return'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

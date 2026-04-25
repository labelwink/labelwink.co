'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // In a real production app, we would verify the 'admin' role here.
      // For the trial run, we'll let any email-authenticated user into /admin
      // if they use this specific page.
      
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sage/5 flex items-center justify-center p-4">
      <div className="bg-white border border-sage/20 p-8 shadow-xl max-w-md w-full rounded-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-charcoal text-cream rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-3xl font-semibold">Admin Access</h1>
          <p className="text-muted-foreground text-sm mt-2">Enter your credentials to access the Label Wink dashboard.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@labelwink.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 border-sage/30 focus-visible:ring-charcoal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs text-muted-foreground hover:text-charcoal transition-colors">Forgot?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-12 border-sage/30 focus-visible:ring-charcoal"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 bg-charcoal hover:bg-charcoal/90 text-white rounded-none uppercase tracking-wider font-semibold shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In To Dashboard'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-sage/10 text-center">
          <p className="text-xs text-muted-foreground">
            Protected area. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  );
}

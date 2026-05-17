import { requireAdmin } from '@/lib/requireAdmin';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import LegalSettingsForm from './LegalSettingsForm';

export default async function LegalSettingsPage() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) {
    redirect('/admin/login');
  }

  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from('site_legal_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1C3829]">Legal & Compliance Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage public legal entity details, grievance officer, and support contacts.</p>
      </div>
      
      <LegalSettingsForm initialData={settings} />
    </div>
  );
}

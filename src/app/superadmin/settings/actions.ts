'use server'

import { requireAdmin } from '@/lib/requireAdmin';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

const LegalSettingsSchema = z.object({
  site_name: z.string().min(1, 'Site name is required'),
  legal_entity_name: z.string().min(2, 'Required').max(150),
  registered_address: z.string().min(10, 'Required').max(300),
  gstin: z.string().max(15).optional().nullable(),
  cin: z.string().optional().nullable(),
  support_email: z.string().email(),
  support_phone: z.string().min(10, 'Required'),
  grievance_officer_name: z.string().min(2, 'Required'),
  grievance_officer_email: z.string().email(),
  grievance_officer_phone: z.string().min(10, 'Required'),
  grievance_officer_designation: z.string().min(2, 'Required'),
  grievance_hours: z.string().min(2, 'Required'),
  grievance_acknowledgement_sla: z.string().min(2, 'Required'),
  grievance_resolution_sla: z.string().min(2, 'Required'),
  website_url: z.string().url().optional().nullable().or(z.literal('')),
});

export async function saveLegalSettings(formData: any) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();

  const parsed = LegalSettingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: 'Validation failed', details: parsed.error.flatten() };
  }

  // Update or insert
  const { data: existing } = await supabase.from('site_legal_settings').select('id').limit(1).maybeSingle();

  let err;
  if (existing) {
    const { error } = await supabase
      .from('site_legal_settings')
      .update({ ...parsed.data, updated_by: auth.id, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    err = error;
  } else {
    const { error } = await supabase
      .from('site_legal_settings')
      .insert({ ...parsed.data, updated_by: auth.id });
    err = error;
  }

  if (err) {
    console.error('Save error:', err);
    return { error: 'Failed to save settings' };
  }

  revalidatePath('/superadmin/settings');
  revalidatePath('/');
  revalidatePath('/grievance');
  
  return { success: true };
}

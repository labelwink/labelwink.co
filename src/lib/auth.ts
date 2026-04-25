import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function getSession() {
  const supabase = createClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getUser() {
  const supabase = createClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Optionally fetch custom user data (like roles) from your public.customers/users table
    // const { data: profile } = await supabase
    //   .from('customers')
    //   .select('*')
    //   .eq('id', user.id)
    //   .single();
    
    return { ...user /*, profile */ };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

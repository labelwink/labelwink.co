import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'


const VALID_ROLES = ['customer', 'employee', 'admin', 'super_admin'] as const

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''

  const offset = (page - 1) * limit
  const supabase = createAdminClient()

  let query = supabase.from('profiles').select('*', { count: 'exact' })

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  if (role) {
    query = query.eq('role', role)
  }

  const { data, count, error: dbError } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    users: data || [],
    totalCount: count || 0,
  })
}

export async function POST(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const body = await req.json()
  const { email, full_name, phone, role } = body

  if (!email || !full_name) {
    return NextResponse.json(
      { error: 'Email and full_name are required' },
      { status: 400 }
    )
  }

  // Validate role against the DB check constraint
  const safeRole = VALID_ROLES.includes(role) ? role : 'employee'

  // Use plain supabase-js admin client for auth.admin API.
  // createServerClient from @supabase/ssr does NOT expose auth.admin methods.
  const supabaseAdmin = createAdminSupabaseClient()

  // Generate a secure temporary password — user can reset via email
  const tempPassword =
    crypto.randomBytes(8).toString('hex') +
    crypto.randomBytes(8).toString('hex').toUpperCase() +
    '@1!'

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // skip email verification
    user_metadata: { full_name },
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || 'Failed to create auth user' },
      { status: 500 }
    )
  }

  // Update profile row using service-role SSR client (fine for DB ops)
  // The 'on_auth_user_created' trigger already inserted the basic profile row.
  const supabase = createAdminClient()
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
      role: safeRole,
    })
    .eq('id', authData.user.id)
    .select()
    .single()

  if (profileError) {
    // Rollback: delete the orphaned auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json(
      { error: `Profile update failed: ${profileError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json(profileData, { status: 201 })
}

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { user_id, email, full_name, role } = await request.json();

    // Determine status based on role
    const status = role === 'admin' ? 'pending' : 'approved';

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id,
        email,
        full_name,
        role,
        status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in create-user-profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

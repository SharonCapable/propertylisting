import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Authorized super admin emails - add new ones here when needed
const AUTHORIZED_SUPER_ADMINS = [
  'senyonam557@gmail.com',
  // Add future super admin emails here
];

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { email } = await request.json();

    // Only allow authorized super admin emails
    if (!AUTHORIZED_SUPER_ADMINS.includes(email)) {
      return NextResponse.json({ error: 'Unauthorized email address' }, { status: 403 });
    }

    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the user email matches
    if (user.email !== email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile to admin
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          role: 'admin',
          status: 'approved'
        })
        .eq('user_id', user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Create new admin profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: 'Super Admin',
          role: 'admin',
          status: 'approved'
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Super admin role assigned successfully' });
  } catch (error) {
    console.error('Error assigning super admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

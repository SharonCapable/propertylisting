import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
    }
    
    // Handle different auth types
    if (type === 'recovery') {
      // Password reset flow - redirect to reset password page
      return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`)
    } else {
      // Email confirmation flow - redirect to login with success message
      return NextResponse.redirect(`${requestUrl.origin}/login?activated=true`)
    }
  }

  // Handle error cases from URL fragments (like #error=access_denied)
  return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_link`)
}

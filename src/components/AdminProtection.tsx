'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';

interface AdminProtectionProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export function AdminProtection({ children, requiredRole }: AdminProtectionProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login?redirectTo=/admin');
          return;
        }

        setUser(session.user);
        
        // Check for super admin first
        if (session.user.email === 'senyonam557@gmail.com') {
          // Ensure super admin profile exists
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (!existingProfile) {
            await supabase
              .from('user_profiles')
              .insert({
                user_id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Super Admin',
                role: 'super_admin',
                status: 'active'
              });
          } else if (existingProfile.role !== 'super_admin') {
            // Update existing profile to super admin
            await supabase
              .from('user_profiles')
              .update({ role: 'super_admin', status: 'active' })
              .eq('user_id', session.user.id);
          }
          
          setIsAdmin(true);
          setUserRole('super_admin');
          return;
        }
        
        // Check user role from user_profiles table
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, status')
          .eq('user_id', session.user.id)
          .single();

        if (error || !profile) {
          // If no profile exists, create one with 'user' role
          await supabase
            .from('user_profiles')
            .insert({
              user_id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              role: 'user',
              status: 'active'
            });
          
          // Redirect regular users to user dashboard
          router.push('/dashboard');
          return;
        }
        
        if (profile.role !== 'admin' && profile.role !== 'property_admin' && profile.role !== 'super_admin') {
          // Redirect regular users to user dashboard
          router.push('/dashboard');
          return;
        }
        
        if (profile.status !== 'active') {
          router.push('/login?message=Account pending approval');
          return;
        }
        
        setIsAdmin(true);
        setUserRole(profile.role);
      } catch (error) {
        console.error('Admin check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin || (requiredRole && userRole !== requiredRole)) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
}

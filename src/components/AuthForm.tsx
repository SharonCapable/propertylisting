'use client'

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleAuthAction = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setError('Please check your email to confirm your account before logging in.');
        } else if (data.session) {
          // Create user profile after successful signup
          try {
            if (data.user?.id && data.user?.email) {
              await fetch('/api/create-user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.email.split('@')[0],
                  role: data.user.email === 'senyonam557@gmail.com' ? 'super_admin' : selectedRole
                })
              });
            }
          } catch (profileError) {
            console.error('Failed to create user profile:', profileError);
          }
          
          router.push('/');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has a profile, create one if not
        if (data.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (!profile) {
            // Create profile for existing user
            try {
              if (data.user?.id && data.user?.email) {
                await fetch('/api/create-user-profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.email.split('@')[0],
                    role: data.user.email === 'senyonam557@gmail.com' ? 'super_admin' : 'user'
                  })
                });
              }
            } catch (profileError) {
              console.error('Failed to create user profile:', profileError);
            }
          }
        }

        router.push('/');
      }
    } catch (error: any) {
      console.error('Authentication error:', error.message);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) throw error;
      
      setMessage('Password reset link sent to your email!');
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Failed to send reset email:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === 'signup' ? 'Create an Account' : 'Log In'}</CardTitle>
        <CardDescription>
          {mode === 'signup' ? 'Enter your details to get started.' : 'Enter your credentials to access your account.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <Input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        {mode === 'signup' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Type</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={selectedRole === 'user'}
                  onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin')}
                  className="text-primary"
                />
                <span className="text-sm">Regular User - Book properties and view history</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin')}
                  className="text-primary"
                />
                <span className="text-sm">Property Admin - Manage properties (requires approval)</span>
              </label>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}
        <Button onClick={handleAuthAction} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : (mode === 'signup' ? 'Sign Up' : 'Log In')}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowForgotPassword(true)} 
          className="w-full max-w-xs mx-auto" 
          disabled={loading}
        >
          Forgot Password
        </Button>
        {showForgotPassword && (
          <Button onClick={handleForgotPassword} className="w-full max-w-xs mx-auto" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

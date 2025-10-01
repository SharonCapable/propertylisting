'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAssignSuperAdmin = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/assign-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'senyonam557@gmail.com'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign super admin role');
      }

      setMessage('Super admin role assigned successfully! You can now access the admin dashboard.');
    } catch (error: any) {
      setError(error.message || 'Failed to assign super admin role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <main className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Setup Super Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Click the button below to assign super admin privileges to your account (senyonam557@gmail.com).
            </p>
            <p className="text-sm text-gray-500">
              This is a one-time setup for the platform owner.
            </p>
            
            <Button 
              onClick={handleAssignSuperAdmin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Assigning...' : 'Assign Super Admin Role'}
            </Button>

            {error && (
              <div className="flex items-center justify-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {message && (
              <div className="flex items-center justify-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

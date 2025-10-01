'use client'

import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const activated = searchParams.get('activated');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          {activated && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
              <h3 className="font-semibold">Account Activated!</h3>
              <p className="text-sm">Your account has been successfully activated. Please log in below.</p>
            </div>
          )}
          <AuthForm mode="login" />
        </div>
      </main>
    </div>
  );
}

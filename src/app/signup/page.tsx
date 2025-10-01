import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex items-center justify-center py-12 px-4">
        <AuthForm mode="signup" />
      </main>
    </div>
  );
}

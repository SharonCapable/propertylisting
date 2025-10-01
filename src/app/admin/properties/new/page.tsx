import { Header } from '@/components/Header';
import { PropertyForm } from '@/components/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <PropertyForm />
      </main>
    </div>
  );
}

'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Header } from '@/components/Header';
import { PropertyForm } from '@/components/PropertyForm';
import { Database } from '@/lib/supabase';

type Property = Database['public']['Tables']['properties']['Row'];

export default function EditPropertyPage() {
  const params = useParams();
  const { id } = params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error('Property not found.');
        }
        if (data) {
          setProperty(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch property details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, supabase]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading property...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <PropertyForm property={property} />
      </main>
    </div>
  );
}

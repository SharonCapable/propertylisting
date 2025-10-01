'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { supabase, Database } from '@/lib/supabase'
import { Header } from '@/components/Header'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Users, Bed, Bath, Wifi, Car, Utensils, Tv, Wind, Waves, CheckCircle, Calendar } from 'lucide-react'
import { BookingForm } from '@/components/BookingForm';

type Property = Database['public']['Tables']['properties']['Row'];

const amenityIcons: { [key: string]: React.ReactNode } = {
  wifi: <Wifi className="h-5 w-5 text-blue-500" />,
  parking: <Car className="h-5 w-5 text-green-500" />,
  kitchen: <Utensils className="h-5 w-5 text-orange-500" />,
  tv: <Tv className="h-5 w-5 text-purple-500" />,
  ac: <Wind className="h-5 w-5 text-cyan-500" />,
  pool: <Waves className="h-5 w-5 text-blue-600" />,
  // Legacy mappings for existing data
  Pool: <Waves className="h-5 w-5 text-blue-600" />,
  WiFi: <Wifi className="h-5 w-5 text-blue-500" />,
  Kitchen: <Utensils className="h-5 w-5 text-orange-500" />,
  'Free parking': <Car className="h-5 w-5 text-green-500" />,
  TV: <Tv className="h-5 w-5 text-purple-500" />,
  'Air Conditioning': <Wind className="h-5 w-5 text-cyan-500" />,
};

export default function PropertyPage() {
  const params = useParams();
  const { id } = params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">Loading...</div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        {error || 'Property not found.'}
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">{property.title}</h1>
          <div className="flex items-center text-gray-600 mt-2">
            <MapPin className="h-5 w-5 mr-1" />
            <span>{property.location}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative h-96 w-full rounded-lg overflow-hidden mb-4">
              <Image
                src={property.images?.[0] || '/placeholder-property.jpg'}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this property</h2>
              <p className="text-gray-700 mb-6">{property.description}</p>

              {(property.available_from || property.available_to) && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Availability Period
                  </h3>
                  <div className="space-y-2 text-blue-800">
                    {property.available_from && (
                      <p>
                        <span className="font-medium">Available from:</span> {new Date(property.available_from).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                    {property.available_to && (
                      <p>
                        <span className="font-medium">Available until:</span> {new Date(property.available_to).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                    {property.available_from && property.available_to && (
                      <p className="text-sm font-medium bg-blue-100 px-3 py-1 rounded-full inline-block">
                        Duration: {Math.ceil((new Date(property.available_to).getTime() - new Date(property.available_from).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-sm">{property.max_guests} Guests</span>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <Bed className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-sm">{property.bedrooms} Bedrooms</span>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <Bath className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-sm">{property.bathrooms} Bathrooms</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities?.map(amenity => (
                  <div key={amenity} className="flex items-center">
                    {amenityIcons[amenity.toLowerCase()] || <div className="h-5 w-5" />}
                    <span className="ml-2 text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingForm property={property} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

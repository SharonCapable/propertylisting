'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, Database } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Download } from 'lucide-react';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];

interface BookingWithProperty extends Booking {
  properties: Property | null;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const { bookingId } = params;
  const [booking, setBooking] = useState<BookingWithProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`*,
            properties (*)
          `)
          .eq('id', bookingId)
          .single();

        if (error) {
          throw new Error('Booking not found.');
        }
        if (data) {
          setBooking(data as BookingWithProperty);
          
          // Send confirmation email
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: data.id,
                type: 'confirmation'
              })
            });
            
            // If visa invitation is needed, send that too
            if (data.needs_invitation) {
              await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: data.id,
                  type: 'visa_invitation'
                })
              });
            }
          } catch (emailError) {
            console.error('Failed to send emails:', emailError);
            // Don't show error to user as booking was successful
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading confirmation...</div>;
  }

  if (error || !booking) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error || 'Booking not found.'}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-3xl">Booking Successful!</CardTitle>
            <CardDescription>Your booking has been confirmed. A confirmation has been sent to your email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Guest Details</h3>
              <p><strong>Name:</strong> {booking.guest_name}</p>
              <p><strong>Email:</strong> {booking.guest_email}</p>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Booking Summary</h3>
              <p><strong>Property:</strong> {booking.properties?.title}</p>
              <p><strong>Location:</strong> {booking.properties?.location}</p>
              <p><strong>Check-in:</strong> {new Date(booking.check_in).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> {new Date(booking.check_out).toLocaleDateString()}</p>
            </div>
            {booking.needs_invitation && (
              <div className="border-t pt-4 text-center bg-yellow-100 p-4 rounded-md">
                <p className="font-bold text-yellow-800">A visa invitation letter will be prepared and sent to you separately.</p>
              </div>
            )}
            <div className="flex flex-col items-center gap-4 pt-4">
              <a href={`/api/generate-pdf?bookingId=${booking.id}&type=booking`} download>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Booking Receipt
                </Button>
              </a>
              {booking.needs_invitation && (
                <a href={`/api/generate-pdf?bookingId=${booking.id}&type=visa`} download>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Visa Invitation Letter
                  </Button>
                </a>
              )}
              <Link href="/">
                <Button variant="outline">Back to Homepage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

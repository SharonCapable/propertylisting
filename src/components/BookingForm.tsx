'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase, Database } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Users,
  Bed,
  Bath,
  Wifi,
  Tv,
  Car,
  Utensils,
  Wind,
  Waves,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  CreditCard,
  Globe,
  FileText,
  CheckCircle,
} from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];

const bookingSchema = z.object({
  guest_name: z.string().min(2, 'Name is required'),
  guest_email: z.string().email('Invalid email address'),
  guest_phone: z.string().min(10, 'Invalid phone number'),
  check_in: z.string().nonempty('Check-in date is required'),
  check_out: z.string().nonempty('Check-out date is required'),
  has_visa: z.enum(['yes', 'no']),
  visa_status: z.string().optional(),
  needs_invitation: z.boolean().default(false),
  passport_number: z.string().optional(),
  passport_country: z.string().optional(),
  passport_expiry: z.string().optional(),
}).refine(data => {
  // Only require passport info if they need a visa AND need an invitation
  if (data.has_visa === 'yes' && data.visa_status === 'need_help' && data.needs_invitation) {
    return !!data.passport_number && !!data.passport_country && !!data.passport_expiry;
  }
  return true;
}, {
  message: 'Passport details are required for a visa invitation.',
  path: ['passport_number'],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  property: Property;
}

const amenityIcons: { [key: string]: React.ReactNode } = {
  wifi: <Wifi className="h-4 w-4 text-blue-600" />,
  parking: <Car className="h-4 w-4 text-green-500" />,
  kitchen: <Utensils className="h-4 w-4 text-orange-600" />,
  tv: <Tv className="h-4 w-4 text-purple-600" />,
  ac: <Wind className="h-4 w-4 text-cyan-500" />,
  pool: <Waves className="h-4 w-4 text-blue-600" />,
  // Legacy mappings
  Pool: <Waves className="h-4 w-4 text-blue-600" />,
  WiFi: <Wifi className="h-4 w-4 text-blue-600" />,
  Kitchen: <Utensils className="h-4 w-4 text-orange-600" />,
  'Free parking': <Car className="h-4 w-4 text-green-500" />,
  TV: <Tv className="h-4 w-4 text-purple-600" />,
  'Air Conditioning': <Wind className="h-4 w-4 text-cyan-500" />,
};

export function BookingForm({ property }: BookingFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const hasVisa = watch('has_visa');
  const needsInvitation = watch('needs_invitation');
  const visaStatus = watch('visa_status');

  const onSubmit: SubmitHandler<BookingFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Calculate total price
      const checkInDate = new Date(data.check_in);
      const checkOutDate = new Date(data.check_out);
      const nights = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24);
      const totalPrice = nights * property.price_per_night;

      const { data: { user } } = await supabase.auth.getUser();

      const { data: newBooking, error } = await supabase.from('bookings').insert({
        user_id: user?.id,
        property_id: property.id,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        check_in: data.check_in,
        check_out: data.check_out,
        total_price: totalPrice,
        has_visa: data.has_visa === 'yes',
        visa_status: data.visa_status,
        needs_invitation: data.needs_invitation,
        passport_number: data.passport_number,
        passport_country: data.passport_country,
        passport_expiry: data.passport_expiry,
        status: 'pending',
      }).select().single();

      if (error) {
        throw error;
      }

      if (newBooking) {
        router.push(`/booking/confirmation/${newBooking.id}`);
      }
    } catch (error) {
      console.error('Booking failed:', error);
      setSubmissionError('Booking failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name">Full Name</Label>
              <Input
                id="guest_name"
                {...register('guest_name')}
                className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
              {errors.guest_name && <p className="text-red-500 text-sm">{errors.guest_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest_email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest_email"
                  type="email"
                  {...register('guest_email')}
                  className="pl-10 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                />
              </div>
              {errors.guest_email && <p className="text-red-500 text-sm">{errors.guest_email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest_phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest_phone"
                  {...register('guest_phone')}
                  className="pl-10 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                />
              </div>
              {errors.guest_phone && <p className="text-red-500 text-sm">{errors.guest_phone.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Check-in/out Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Stay Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in">Check-in Date</Label>
                <Input
                  id="check_in"
                  type="date"
                  {...register('check_in')}
                />
                {errors.check_in && <p className="text-red-500 text-sm">{errors.check_in.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_out">Check-out Date</Label>
                <Input
                  id="check_out"
                  type="date"
                  {...register('check_out')}
                />
                {errors.check_out && <p className="text-red-500 text-sm">{errors.check_out.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visa Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Visa Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Do you need a visa to visit Ghana?</Label>
              <RadioGroup 
                value={hasVisa} 
                onValueChange={(value) => setValue('has_visa', value as 'yes' | 'no')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no-visa" />
                  <Label htmlFor="no-visa">No, I don't need a visa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes-visa" />
                  <Label htmlFor="yes-visa">Yes, I need a visa</Label>
                </div>
              </RadioGroup>
            </div>

            {hasVisa === 'no' && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800 text-sm">Great! You can proceed with your booking.</p>
              </div>
            )}

            {hasVisa === 'yes' && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Do you already have a valid visa?</Label>
                <RadioGroup 
                  value={visaStatus} 
                  onValueChange={(value) => setValue('visa_status', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="have_visa" id="have-visa" />
                    <Label htmlFor="have-visa">Yes, I have a visa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="need_help" id="need-help" />
                    <Label htmlFor="need-help">No, I need help getting one</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {hasVisa === 'yes' && visaStatus === 'need_help' && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Checkbox 
                  id="invitation-letter" 
                  checked={needsInvitation} 
                  onCheckedChange={(checked) => setValue('needs_invitation', !!checked)} 
                />
                <div className="space-y-1">
                  <Label htmlFor="invitation-letter" className="text-sm font-medium">
                    I need a visa invitation letter
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    We'll provide an official invitation letter to support your visa application
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passport Information */}
        {(hasVisa === 'yes' && visaStatus === 'need_help' && needsInvitation) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Passport Information Required
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Please provide your passport details for the visa invitation letter
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input 
                  id="passport_number" 
                  {...register('passport_number')}
                  className="font-mono" 
                  placeholder="e.g., A12345678"
                />
                {errors.passport_number && <p className="text-red-500 text-sm">{errors.passport_number.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_country">Country of Passport Issue</Label>
                <Input 
                  id="passport_country" 
                  {...register('passport_country')}
                  placeholder="e.g., United States"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_expiry">Passport Expiry Date</Label>
                <Input 
                  id="passport_expiry" 
                  type="date" 
                  {...register('passport_expiry')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Now Button */}
        <Button size="lg" className="w-full" type="submit" disabled={isSubmitting}>
          <CreditCard className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Processing...' : 'Complete Booking'}
        </Button>

        {submissionError && (
          <p className="text-red-600 text-center">{submissionError}</p>
        )}
      </form>
    </div>
  );
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          title: string
          description: string
          price_per_night: number
          location: string
          images: string[]
          amenities: string[]
          max_guests: number
          bedrooms: number
          bathrooms: number
          type: string | null
          created_by: string | null
          available_from: string | null
          available_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price_per_night: number
          location: string
          images: string[]
          amenities: string[]
          max_guests: number
          bedrooms: number
          bathrooms: number
          type?: string | null
          created_by?: string | null
          available_from?: string | null
          available_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price_per_night?: number
          location?: string
          images?: string[]
          amenities?: string[]
          max_guests?: number
          bedrooms?: number
          bathrooms?: number
          type?: string | null
          created_by?: string | null
          available_from?: string | null
          available_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string | null
          property_id: string
          guest_name: string
          guest_email: string
          guest_phone: string
          check_in: string
          check_out: string
          total_price: number
          has_visa: boolean
          visa_type: string | null
          visa_status: string | null
          needs_invitation: boolean
          passport_number: string | null
          passport_country: string | null
          passport_expiry: string | null
          invitation_details: string | null
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          property_id: string
          guest_name: string
          guest_email: string
          guest_phone: string
          check_in: string
          check_out: string
          total_price: number
          has_visa: boolean
          visa_type?: string | null
          visa_status?: string | null
          needs_invitation: boolean
          passport_number?: string | null
          passport_country?: string | null
          passport_expiry?: string | null
          invitation_details?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          property_id?: string
          guest_name?: string
          guest_email?: string
          guest_phone?: string
          check_in?: string
          check_out?: string
          total_price?: number
          has_visa?: boolean
          visa_type?: string | null
          visa_status?: string | null
          needs_invitation?: boolean
          passport_number?: string | null
          passport_country?: string | null
          passport_expiry?: string | null
          invitation_details?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'admin' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'user' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

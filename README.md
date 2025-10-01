Property Booking Platform

A modern, full-stack property booking platform built with Next.js, Supabase, and TypeScript. Features comprehensive booking management, visa invitation support, and admin dashboard.

## Features

### 🏠 Property Management
- Property listings with detailed information
- Image galleries and amenity listings
- Location-based search and filtering
- Price and availability filtering

### 📅 Booking System
- Real-time availability checking
- Visa status collection
- Passport information for visa invitations
- PDF booking confirmations
- Email notifications

### 👤 User Authentication
- Supabase Auth integration
- User account management
- Booking history tracking
- Secure session handling

### 📧 Email & Documents
- Automated booking confirmations
- Visa invitation letter generation
- PDF document generation
- Resend email integration

### 🔧 Admin Dashboard
- Property management (CRUD operations)
- Booking overview and management
- User booking tracking

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend
- **PDF Generation**: PDFKit
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account (for emails)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd circlepoint
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Fill in your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `RESEND_API_KEY`: Your Resend API key

### Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  images TEXT[] NOT NULL,
  amenities TEXT[] NOT NULL,
  max_guests INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  has_visa BOOLEAN NOT NULL,
  visa_type TEXT,
  needs_invitation BOOLEAN DEFAULT FALSE,
  passport_number TEXT,
  passport_country TEXT,
  passport_expiry DATE,
  invitation_details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to find available properties
CREATE OR REPLACE FUNCTION get_available_properties(start_date text, end_date text)
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM properties p
  WHERE NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE
      b.property_id = p.id AND
      b.status = 'confirmed' AND
      (b.check_in, b.check_out) OVERLAPS (start_date::date, end_date::date)
  );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (true);
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anonymous users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.role() = 'anon');
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── booking/           # Booking pages
│   ├── property/          # Individual property pages
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utilities and configurations
└── data/                 # Mock data and constants
```

## Key Features Explained

### Booking Flow
1. User searches for properties by location, dates, and price
2. System checks availability using database function
3. User fills booking form with visa information
4. System generates PDF confirmation and sends emails
5. Admin can manage bookings through dashboard

### Visa Support
- Collects visa status during booking
- Generates official invitation letters
- Includes passport information for visa applications
- Automated email delivery of documents

### Admin Features
- Property CRUD operations
- Booking management and overview
- User booking history tracking

## Deployment

The application is ready for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=your_resend_api_key

# App
NEXT_PUBLIC_APP_URL=your_app_url
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

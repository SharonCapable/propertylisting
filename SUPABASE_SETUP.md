# Supabase Setup Instructions for CirclePoint Homes

## Required Database Tables

### 1. User Profiles Table
```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  username TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  date_of_birth DATE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(username)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. Properties Table
```sql
-- Create properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 2,
  price_per_night DECIMAL(10,2) NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  available_from DATE,
  available_to DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view properties" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage their properties" ON properties
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );
```

### 3. Bookings Table
```sql
-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_requests TEXT DEFAULT '',
  needs_invitation BOOLEAN DEFAULT false,
  passport_number TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property owners can view bookings for their properties" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );
```

## Required Storage Buckets

### 1. Property Media Bucket

**Step 1: Create the bucket**
1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name: `property-media`
4. Set as Public bucket: ✅ (checked)
5. File size limit: `10 MB`
6. Allowed MIME types: `image/*, video/*`

**Step 2: Set up bucket policies**
```sql
-- Allow public access to view files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-media' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Step 3: Verify bucket configuration**
- Bucket name: `property-media`
- Public: Yes
- File size limit: 10 MB
- Allowed file types: Images and Videos
- Policies: Public read, authenticated upload/update/delete

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Functions (Optional)

### Auto-update timestamps
```sql
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verification Checklist

- [ ] `user_profiles` table created with RLS policies
- [ ] `properties` table created with RLS policies  
- [ ] `bookings` table created with RLS policies
- [ ] `property-media` storage bucket created and configured
- [ ] Storage bucket policies set up correctly
- [ ] Environment variables configured
- [ ] Test file upload to storage bucket
- [ ] Test user registration and profile creation
- [ ] Test property creation with media upload

## Troubleshooting

### Common Issues

1. **Storage upload fails**: Check bucket policies and ensure bucket is public
2. **RLS blocking queries**: Verify user authentication and policy conditions
3. **File size errors**: Ensure files are under 10MB limit
4. **MIME type errors**: Only images and videos are allowed

### Testing Storage Upload

You can test the storage setup with this code:
```javascript
const { data, error } = await supabase.storage
  .from('property-media')
  .upload(`${user.id}/test-image.jpg`, file);
```

The file structure will be: `property-media/{user_id}/{filename}`

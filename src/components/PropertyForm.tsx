"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaUpload } from "@/components/MediaUpload"
import {
  Home,
  MapPin,
  Bed,
  Bath,
  Users,
  DollarSign,
  Wifi,
  Car,
  Utensils,
  Tv,
  Wind,
  Waves,
  ImageIcon,
  Building,
  Calendar,
  Star,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  source: 'upload' | 'url';
}

interface PropertyFormData {
  title: string
  description: string
  type: string
  location: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  pricePerNight: number
  amenities: string[]
  images: string[]
  availableFrom: string
  availableTo: string
}

import { Database } from '@/lib/supabase'

type Property = Database['public']['Tables']['properties']['Row'];

const propertyTypes = [
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "house", label: "House", icon: Home },
  { value: "villa", label: "Villa", icon: Home },
  { value: "condo", label: "Condo", icon: Building },
]

const commonAmenities = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "kitchen", label: "Kitchen", icon: Utensils },
  { id: "tv", label: "TV", icon: Tv },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "pool", label: "Pool", icon: Waves },
]

const STORAGE_KEY = 'circlepoint_property_draft'

export function PropertyForm({ property }: { property?: Property | null }) {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    type: "",
    location: "",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 0,
    amenities: [],
    images: [],
    availableFrom: "",
    availableTo: "",
  })

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [autoSaving, setAutoSaving] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Load existing property data for editing
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        description: property.description || "",
        type: property.type || "",
        location: property.location || "",
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        maxGuests: property.max_guests || 2,
        pricePerNight: property.price_per_night || 0,
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        images: Array.isArray(property.images) ? property.images : [],
        availableFrom: property.available_from || "",
        availableTo: property.available_to || "",
      })
      
      // Set media items for existing images
      if (property.images && Array.isArray(property.images)) {
        const existingMedia: MediaItem[] = property.images.map((url, index) => ({
          id: `existing-${index}`,
          url,
          type: 'image' as const,
          source: 'upload' as const
        }))
        setMediaItems(existingMedia)
      }
    } else {
      // Load draft data for new properties
      const savedDraft = localStorage.getItem(STORAGE_KEY)
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft)
          setFormData(parsedDraft)
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
  }, [property])

  // Auto-save draft (excluding images) - only for new properties
  useEffect(() => {
    if (!property && (formData.title || formData.description || formData.location)) {
      setAutoSaving(true)
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        setAutoSaving(false)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [formData, property])

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const handleMediaChange = (media: MediaItem[]) => {
    setMediaItems(media)
    const imageUrls = media.map(item => item.url)
    setFormData(prev => ({ ...prev, images: imageUrls }))
    
    // Force re-render to ensure MediaUpload updates properly
    setAutoSaving(true)
    setTimeout(() => setAutoSaving(false), 500)
  }

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.type || !formData.location) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.pricePerNight <= 0) {
        throw new Error('Price per night must be greater than 0')
      }

      if (formData.images.length === 0) {
        throw new Error('Please upload at least one image')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to create properties')
      }

      const propertyData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        max_guests: formData.maxGuests,
        price_per_night: formData.pricePerNight,
        images: formData.images,
        amenities: formData.amenities,
        available_from: formData.availableFrom || null,
        available_to: formData.availableTo || null,
        created_by: user.id,
      }

      if (property) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)

        if (updateError) throw updateError
        setMessage('Property updated successfully!')
      } else {
        // Create new property
        const { data: newProperty, error: insertError } = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single()

        if (insertError) throw insertError
        setMessage('Property created successfully!')
        clearDraft() // Clear draft after successful creation
        
        // Redirect to property management or admin dashboard
        setTimeout(() => {
          router.push('/admin')
        }, 2000)
      }

    } catch (error: any) {
      console.error('Property submission error:', error)
      setError(error.message || 'Failed to save property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      {!property && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Draft auto-saved locally</span>
          {autoSaving && (
            <div className="flex items-center">
              <Save className="h-3 w-3 mr-1 animate-pulse" />
              Saving...
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Details Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Home className="h-5 w-5 text-primary" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Property Title
                </Label>
                <Input
                  id="title"
                  placeholder="Beautiful Downtown Apartment"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Property Type
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your property, its unique features, and what makes it special..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="min-h-[100px] bg-input"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="location"
                placeholder="123 Main Street, City, State, Country"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="bg-input"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Specifications */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="h-5 w-5 text-primary" />
              Property Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  Bedrooms
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", Number.parseInt(e.target.value) || 0)}
                  className="bg-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  Bathrooms
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", Number.parseInt(e.target.value) || 0)}
                  className="bg-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Max Guests
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxGuests}
                  onChange={(e) => handleInputChange("maxGuests", Number.parseInt(e.target.value) || 1)}
                  className="bg-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Price/Night
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerNight}
                  onChange={(e) => handleInputChange("pricePerNight", Number.parseFloat(e.target.value) || 0)}
                  className="bg-input"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-primary" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableFrom" className="text-sm font-medium">
                  Available From
                </Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => handleInputChange("availableFrom", e.target.value)}
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableTo" className="text-sm font-medium">
                  Available To
                </Label>
                <Input
                  id="availableTo"
                  type="date"
                  value={formData.availableTo}
                  onChange={(e) => handleInputChange("availableTo", e.target.value)}
                  className="bg-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {commonAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity.id)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card hover:bg-muted border-border"
                  }`}
                >
                  <amenity.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{amenity.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Images Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="h-5 w-5 text-primary" />
              Property Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUpload
              onMediaChange={handleMediaChange}
              initialMedia={mediaItems}
              maxFiles={10}
            />
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-center text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            {message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="px-8 bg-transparent"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

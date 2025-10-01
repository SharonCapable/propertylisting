import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Bed, Bath, Calendar, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Property {
  id: string
  title: string
  description: string
  type: string
  price_per_night: number
  location: string
  images: string[]
  max_guests: number
  bedrooms: number
  bathrooms: number
  available_from?: string
  available_to?: string
  amenities?: string[]
}

interface PropertyCardProps {
  property: Property
  viewMode?: 'grid' | 'list'
}

export function PropertyCard({ property, viewMode = 'grid' }: PropertyCardProps) {
  const isAvailable = () => {
    if (!property.available_from || !property.available_to) return true;
    const now = new Date();
    const availableFrom = new Date(property.available_from);
    const availableTo = new Date(property.available_to);
    return now >= availableFrom && now <= availableTo;
  };

  const getAvailabilityStatus = () => {
    if (!property.available_from || !property.available_to) return null;
    
    const now = new Date();
    const availableFrom = new Date(property.available_from);
    const availableTo = new Date(property.available_to);
    
    if (now < availableFrom) {
      return `Available from ${availableFrom.toLocaleDateString()}`;
    } else if (now > availableTo) {
      return 'Availability expired - Contact admin';
    }
    return `Available until ${availableTo.toLocaleDateString()}`;
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/property/${property.id}`} className="block">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex flex-col md:flex-row">
            <div className="relative h-48 md:h-auto md:w-80 flex-shrink-0">
              <Image
                src={property.images[0] || '/placeholder-property.jpg'}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <CardContent className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-xl">{property.title}</h3>
                      <Badge variant="secondary">{property.type}</Badge>
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(property.price_per_night)}</div>
                    <div className="text-gray-600 text-sm">per night</div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{property.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{property.max_guests} guests</span>
                  </div>
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms} beds</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms} baths</span>
                  </div>
                </div>

                {/* Availability Status */}
                {getAvailabilityStatus() && (
                  <div className={`flex items-center gap-2 text-sm mb-4 ${
                    isAvailable() ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    <Calendar className="h-4 w-4" />
                    <span>{getAvailabilityStatus()}</span>
                  </div>
                )}

                {/* Amenities Preview */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href={`/property/${property.id}`} className="w-full">
                  <Button className="w-full" disabled={!isAvailable()}>
                    {isAvailable() ? 'View Details' : 'Contact Admin'}
                  </Button>
                </Link>
              </CardFooter>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link href={`/property/${property.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative h-48 w-full">
          <Image
            src={property.images[0] || '/placeholder-property.jpg'}
            alt={property.title}
            fill
            className="object-cover"
          />
          {!isAvailable() && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Limited
              </Badge>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">{property.type}</Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.location}</span>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{property.max_guests} guests</span>
            </div>
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms} beds</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms} baths</span>
            </div>
          </div>

          {/* Availability Status */}
          {getAvailabilityStatus() && (
            <div className={`flex items-center gap-1 text-xs mb-3 ${
              isAvailable() ? 'text-green-600' : 'text-orange-600'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>{getAvailabilityStatus()}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">{formatCurrency(property.price_per_night)}</span>
              <span className="text-gray-600 text-sm"> / night</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Link href={`/property/${property.id}`} className="w-full">
            <Button className="w-full" disabled={!isAvailable()}>
              {isAvailable() ? 'View Details' : 'Contact Admin'}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </Link>
  )
}

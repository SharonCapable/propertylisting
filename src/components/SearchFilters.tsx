'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, MapPin, Calendar, DollarSign, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SearchFiltersProps {
  onSearch: (filters: {
    location: string
    checkIn: string
    checkOut: string
    maxPrice: number | null
  }) => void
}

// Common locations for suggestions - Ghana focused
const POPULAR_LOCATIONS = [
  'Accra, Greater Accra',
  'Kumasi, Ashanti',
  'Tamale, Northern',
  'Cape Coast, Central',
  'Sekondi-Takoradi, Western',
  'Ho, Volta',
  'Koforidua, Eastern',
  'Sunyani, Bono',
  'Wa, Upper West',
  'Bolgatanga, Upper East',
  'Tema, Greater Accra',
  'Elmina, Central',
  'Techiman, Bono East',
  'Tarkwa, Western',
  'Obuasi, Ashanti',
  'Dunkwa-on-Offin, Central',
  'Nkawkaw, Eastern',
  'Kintampo, Bono East'
];

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [existingLocations, setExistingLocations] = useState<string[]>([])
  const locationInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch existing property locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('location')
          .not('location', 'is', null);
        
        if (!error && data) {
          const uniqueLocations = [...new Set(data.map(p => p.location))];
          setExistingLocations(uniqueLocations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };

    fetchLocations();
  }, []);

  // Handle location input changes and generate suggestions
  useEffect(() => {
    if (location.length >= 2) {
      const allLocations = [...existingLocations, ...POPULAR_LOCATIONS];
      const filtered = allLocations.filter(loc =>
        loc.toLowerCase().includes(location.toLowerCase())
      );
      
      // Remove duplicates and limit to 8 suggestions
      const uniqueFiltered = [...new Set(filtered)].slice(0, 8);
      setLocationSuggestions(uniqueFiltered);
      setShowSuggestions(uniqueFiltered.length > 0);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location, existingLocations]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !locationInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowSuggestions(false);
  };

  const clearLocation = () => {
    setLocation('');
    setShowSuggestions(false);
    locationInputRef.current?.focus();
  };

  const handleSearch = () => {
    onSearch({
      location,
      checkIn,
      checkOut,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
    })
  }

  // Set minimum date to today for check-in
  const today = new Date().toISOString().split('T')[0];
  
  // Set minimum check-out date to check-in date + 1 day
  const minCheckOut = checkIn 
    ? new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : today;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Location Input with Autocomplete */}
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
          <Input
            ref={locationInputRef}
            placeholder="Where to?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => location.length >= 2 && setShowSuggestions(true)}
            className="pl-10 pr-8"
          />
          {location && (
            <button
              onClick={clearLocation}
              className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Location Suggestions Dropdown */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {locationSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {suggestion}
                    {existingLocations.includes(suggestion) && (
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        • Available
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Check-in Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="date"
            placeholder="Check-in"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={today}
            className="pl-10"
          />
        </div>

        {/* Check-out Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="date"
            placeholder="Check-out"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={minCheckOut}
            className="pl-10"
          />
        </div>

        {/* Max Price */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="number"
            placeholder="Max price/night"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
            className="pl-10"
          />
        </div>
      </div>

      {/* Search Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Button onClick={handleSearch} className="w-full sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Search Properties
        </Button>
        
        {/* Quick Clear All */}
        {(location || checkIn || checkOut || maxPrice) && (
          <Button 
            variant="outline" 
            onClick={() => {
              setLocation('');
              setCheckIn('');
              setCheckOut('');
              setMaxPrice('');
              setShowSuggestions(false);
            }}
            className="w-full sm:w-auto"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Search Tips */}
      {!location && !checkIn && !checkOut && !maxPrice && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Pro tip:</strong> Start typing a location to see suggestions, or select dates to check availability.
          </p>
        </div>
      )}
    </div>
  )
}

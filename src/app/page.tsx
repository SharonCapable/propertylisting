'use client'

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PropertyCard } from '@/components/PropertyCard';
import { SearchFilters } from '@/components/SearchFilters';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase, Database } from '@/lib/supabase';
import { Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];

const PROPERTY_TYPES = [
  'All Types',
  'Apartment',
  'House',
  'Villa',
  'Condo',
  'Studio',
  'Townhouse',
  'Loft',
  'Cabin',
  'Cottage'
];

const SORT_OPTIONS = [
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'bedrooms', label: 'Most Bedrooms' },
  { value: 'guests', label: 'Most Guests' }
];

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('All Types');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase.from('properties').select('*');
        if (error) {
          throw error;
        }
        setProperties(data || []);
        setFilteredProperties(data || []);
      } catch (err: any) {
        setError('Failed to fetch properties. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let results = [...properties];

    // Apply type filter
    if (selectedType !== 'All Types') {
      results = results.filter(property => 
        property.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        results.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case 'price_high':
        results.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'bedrooms':
        results.sort((a, b) => b.bedrooms - a.bedrooms);
        break;
      case 'guests':
        results.sort((a, b) => b.max_guests - a.max_guests);
        break;
    }

    setFilteredProperties(results);
  }, [properties, selectedType, sortBy]);

  const handleSearch = async (filters: {
    location: string;
    checkIn: string;
    checkOut: string;
    maxPrice: number | null;
  }) => {
    console.log('Searching with filters:', filters);
    setLoading(true);
    
    try {
      // If dates are provided, use the availability function
      if (filters.checkIn && filters.checkOut) {
        const { data, error } = await supabase.rpc('get_available_properties', {
          start_date: filters.checkIn,
          end_date: filters.checkOut
        });
        
        if (error) throw error;
        
        let results = data || [];
        
        // Apply additional filters
        if (filters.location) {
          results = results.filter((property: Property) =>
            property.location.toLowerCase().includes(filters.location.toLowerCase())
          );
        }

        if (filters.maxPrice) {
          results = results.filter((property: Property) =>
            property.price_per_night <= filters.maxPrice!
          );
        }
        
        setProperties(results);
      } else {
        // Filter existing properties
        let results = [...properties];
        
        if (filters.location) {
          results = results.filter((property: Property) =>
            property.location.toLowerCase().includes(filters.location.toLowerCase())
          );
        }
        
        if (filters.maxPrice) {
          results = results.filter((property: Property) =>
            property.price_per_night <= filters.maxPrice!
          );
        }
        
        setProperties(results);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Failed to search properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedType('All Types');
    setSortBy('newest');
    // Refetch original properties
    const fetchProperties = async () => {
      const { data } = await supabase.from('properties').select('*');
      setProperties(data || []);
    };
    fetchProperties();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Book from our exclusive collection of premium properties around the world
          </p>
        </div>

        <SearchFilters onSearch={handleSearch} />

        <div className="mt-12">
          {/* Header with filters and sorting */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-gray-900">Properties</h2>
              <span className="text-gray-600">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Property Type Filter */}
              <div className="flex items-center gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Clear Filters */}
              {(selectedType !== 'All Types' || sortBy !== 'newest') && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {(selectedType !== 'All Types') && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedType !== 'All Types' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {selectedType}
                  <button
                    onClick={() => setSelectedType('All Types')}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 mt-4">Loading properties...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-600">
              <p className="text-lg">{error}</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                : "space-y-6"
            }>
              {filteredProperties.map(property => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedType !== 'All Types' || sortBy !== 'newest' 
                  ? 'No properties match your filters' 
                  : 'No properties available'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedType !== 'All Types' || sortBy !== 'newest'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Be the first to add properties to your platform!'
                }
              </p>
              {selectedType !== 'All Types' || sortBy !== 'newest' ? (
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              ) : (
                <a 
                  href="/admin" 
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to Admin Dashboard
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

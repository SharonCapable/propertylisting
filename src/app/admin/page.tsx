'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { AdminProtection } from '@/components/AdminProtection';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  BarChart3, 
  Home, 
  Users, 
  DollarSign, 
  Settings,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Shield
} from 'lucide-react';

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  type: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  created_at: string;
}

interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
  properties: Property | null;
}

interface PropertyStats {
  id: string;
  title: string;
  bookings_count: number;
  total_revenue: number;
  occupancy_rate: number;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [propertyStats, setPropertyStats] = useState<PropertyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClientComponentClient();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // setUserRole(profile.role);
      } else if (user.email === 'senyonam557@gmail.com') {
        // setUserRole('super_admin');
      }

      // Fetch all data in parallel for better performance
      const [bookingsResult, propertiesResult, usersResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, property_id, total_price, created_at')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('properties')
          .select('id, title, location, type, price_per_night, bedrooms, bathrooms, max_guests, created_at')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('user_profiles')
          .select('user_id, email, full_name, username, role, status, created_at')
          .order('created_at', { ascending: false })
      ]);

      if (bookingsResult.error) throw bookingsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;
      if (usersResult.error) throw usersResult.error;

      const bookingsData = bookingsResult.data || [];
      const propertiesData = propertiesResult.data || [];
      const usersData = usersResult.data || [];

      setBookings(bookingsData as Booking[]);
      setProperties(propertiesData || []);
      setUsers(usersData || []);

      // Optimize property stats calculation
      if (bookingsData.length > 0 && propertiesData.length > 0) {
        // Create a map for faster lookups
        const bookingsByProperty = bookingsData.reduce((acc, booking) => {
          if (!acc[booking.property_id]) acc[booking.property_id] = [];
          acc[booking.property_id].push(booking);
          return acc;
        }, {} as Record<string, any[]>);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = propertiesData.map(property => {
          const propertyBookings = bookingsByProperty[property.id] || [];
          const totalRevenue = propertyBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
          
          const recentBookings = propertyBookings.filter(booking => 
            new Date(booking.created_at) > thirtyDaysAgo
          );
          const occupancyRate = Math.min((recentBookings.length / 30) * 100, 100);

          return {
            id: property.id,
            title: property.title,
            bookings_count: propertyBookings.length,
            total_revenue: totalRevenue,
            occupancy_rate: occupancyRate
          };
        }).sort((a, b) => b.total_revenue - a.total_revenue);
        
        setPropertyStats(stats);
      } else {
        setPropertyStats([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  // Refresh data when returning from property creation
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    
    const handlePopState = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleUserStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_price, 0);
  const totalBookings = bookings.length;
  const totalProperties = properties.length;
  const totalUsers = users.length;
  const pendingUsers = users.filter(user => user.status === 'pending').length;
  const adminUsers = users.filter(user => user.role === 'admin').length;

  // Recent activity calculations
  const recentBookings = bookings.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage properties, users, and track platform performance</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/properties/add">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                <CardContent className="flex items-center p-6">
                  <PlusCircle className="h-12 w-12 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold">Add New Property</h3>
                    <p className="text-gray-600">Create a new property listing</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/properties">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
                <CardContent className="flex items-center p-6">
                  <Home className="h-12 w-12 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold">Manage Properties</h3>
                    <p className="text-gray-600">View and edit existing properties</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500" onClick={() => setActiveTab('users')}>
              <CardContent className="flex items-center p-6">
                <Users className="h-12 w-12 text-purple-600 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold">Manage Users</h3>
                  <p className="text-gray-600">Review user accounts and permissions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Home className="h-6 w-6 text-blue-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Properties</p>
                    <p className="text-xl font-bold text-gray-900">{totalProperties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Bookings</p>
                    <p className="text-xl font-bold text-gray-900">{totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Revenue</p>
                    <p className="text-xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-purple-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Users</p>
                    <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-orange-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-gray-900">{pendingUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-indigo-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Admins</p>
                    <p className="text-xl font-bold text-gray-900">{adminUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Top Performing Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : propertyStats.length > 0 ? (
                      <div className="space-y-4">
                        {propertyStats.slice(0, 5).map((stat, index) => (
                          <Link key={stat.id} href={`/admin/properties/${stat.id}`}>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                              <div className="flex items-center">
                                <span className="text-sm font-bold text-gray-500 mr-3">#{index + 1}</span>
                                <div>
                                  <p className="font-medium">{stat.title}</p>
                                  <p className="text-sm text-gray-600">
                                    {stat.bookings_count} bookings • {stat.occupancy_rate.toFixed(1)}% occupancy
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold text-green-600">${stat.total_revenue.toLocaleString()}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No properties yet. Add your first property to see stats!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{booking.guest_name}</p>
                              <p className="text-sm text-gray-600">
                                Booked {booking.properties?.title || 'Unknown Property'}
                              </p>
                            </div>
                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </div>
                        ))}
                        {recentBookings.length === 0 && (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No recent activity</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Properties</CardTitle>
                  <Link href="/admin/properties/add">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : properties.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Price/Night</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{property.title}</p>
                                <p className="text-sm text-gray-600">
                                  Added {new Date(property.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{property.type}</TableCell>
                            <TableCell>{property.location}</TableCell>
                            <TableCell>${property.price_per_night}</TableCell>
                            <TableCell>
                              {property.max_guests} guests • {property.bedrooms}br • {property.bathrooms}ba
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No properties yet</p>
                      <Link href="/admin/properties/add">
                        <Button>Add Your First Property</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : bookings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Guests</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{booking.guest_name}</p>
                                <p className="text-sm text-gray-600">{booking.guest_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{booking.properties?.title || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{new Date(booking.check_in).toLocaleDateString()}</p>
                                <p className="text-gray-600">to {new Date(booking.check_out).toLocaleDateString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>{booking.guests}</TableCell>
                            <TableCell>${booking.total_price}</TableCell>
                            <TableCell>
                              <Badge variant={
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {booking.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No bookings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {user.full_name || user.username || 'No name'}
                                </p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                user.status === 'approved' ? 'default' :
                                user.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {user.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUserStatusUpdate(user.user_id, 'approved')}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUserStatusUpdate(user.user_id, 'rejected')}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No users yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AdminProtection>
  );
}

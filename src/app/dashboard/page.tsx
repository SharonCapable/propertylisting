'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Star,
  Heart,
  BookOpen,
  User,
  Settings,
  LogOut
} from 'lucide-react'

interface Booking {
  id: string
  property_id: string
  check_in: string
  check_out: string
  guests: number
  total_amount: number
  status: string
  created_at: string
  properties: {
    title: string
    location: string
    images: string[]
  }
}

interface UserProfile {
  user_id: string
  email: string
  full_name: string
  role: string
  status: string
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login?redirectTo=/dashboard')
        return
      }

      setUser(session.user)
      
      // Get user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Get user bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            location,
            images
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (bookingsData) {
        setBookings(bookingsData)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Manage your bookings and explore new properties</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Browse Properties
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {bookings.filter(b => b.status === 'confirmed').length} confirmed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {bookings.filter(b => 
                      new Date(b.check_in) > new Date() && b.status === 'confirmed'
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Next 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₵{bookings.reduce((sum, b) => sum + b.total_amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.slice(0, 3).length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img
                            src={booking.properties.images[0] || '/placeholder-property.jpg'}
                            alt={booking.properties.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="font-semibold">{booking.properties.title}</h4>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {booking.properties.location}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600 mb-4">Start exploring our amazing properties!</p>
                    <Button onClick={() => router.push('/')}>Browse Properties</Button>
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
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex space-x-4">
                            <img
                              src={booking.properties.images[0] || '/placeholder-property.jpg'}
                              alt={booking.properties.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="text-lg font-semibold">{booking.properties.title}</h3>
                              <p className="text-gray-600 flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {booking.properties.location}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Booking ID: {booking.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Check-in</p>
                            <p className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Check-out</p>
                            <p className="font-medium">{new Date(booking.check_out).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Guests</p>
                            <p className="font-medium">{booking.guests}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="font-medium">₵{booking.total_amount.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/property/${booking.property_id}`)}
                          >
                            View Property
                          </Button>
                          {booking.status === 'confirmed' && new Date(booking.check_in) > new Date() && (
                            <Button variant="outline" size="sm">
                              Modify Booking
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600 mb-6">You haven't made any bookings yet. Start exploring!</p>
                    <Button onClick={() => router.push('/')}>Browse Properties</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discover Amazing Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to explore?</h3>
                  <p className="text-gray-600 mb-6">Browse our collection of beautiful properties across Ghana</p>
                  <Button onClick={() => router.push('/')} size="lg">
                    Browse All Properties
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-gray-600">{profile?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Type</label>
                  <Badge variant="outline" className="ml-2">
                    {profile?.role === 'user' ? 'Regular User' : profile?.role}
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/account')}
                    className="mr-2"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            About CirclePoint Homes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted partner for premium property rentals worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Our Story</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray">
              <p>
                CirclePoint Homes was founded with a simple mission: to provide travelers with 
                exceptional accommodation experiences in the world's most desirable destinations. 
                We carefully curate each property to ensure it meets our high standards for 
                comfort, style, and location.
              </p>
              <p>
                Whether you're planning a romantic getaway, a family vacation, or a business trip, 
                our premium properties offer the perfect blend of luxury and convenience. From 
                historic palazzos in Rome to modern penthouses in Paris, each property tells its 
                own unique story.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why Choose Us</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Handpicked premium properties in prime locations</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>24/7 customer support for peace of mind</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Seamless booking process with instant confirmation</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Visa invitation support for international travelers</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Secure payment processing and booking protection</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Mail className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600">support@circlepointhomes.com</p>
                <p className="text-gray-600">bookings@circlepointhomes.com</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Phone className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
                <p className="text-gray-600">+44 20 7123 4567</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <MapPin className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-gray-600">123 Premium Street</p>
                <p className="text-gray-600">London, UK SW1A 1AA</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Clock className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">Hours</h3>
                <p className="text-gray-600">24/7 Support</p>
                <p className="text-gray-600">Always here to help</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Card>
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Book Your Stay?</h3>
              <p className="text-gray-600 mb-6">
                Discover our collection of premium properties and start planning your perfect getaway.
              </p>
              <a 
                href="/" 
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Browse Properties
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

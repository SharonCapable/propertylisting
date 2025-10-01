'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Eye, 
  Download,
  FileImage,
  FileVideo,
  User,
  Calendar,
  HardDrive,
  Activity,
  Building
} from 'lucide-react'

interface StorageFile {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: {
    size?: number
    mimetype?: string
    cacheControl?: string
  }
}

interface AdminActivity {
  id: string
  user_id: string
  email: string
  full_name: string
  role: string
  property_count: number
  last_activity: string
  total_uploads: number
  storage_used: number
}

export function AdminOversight() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOversightData()
  }, [])

  const fetchOversightData = async () => {
    try {
      // Get all storage files
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('property-media')
        .list('', {
          limit: 1000,
          offset: 0
        })

      if (storageError) throw storageError

      // Get admin activities with property counts
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          role,
          created_at
        `)
        .in('role', ['admin', 'super_admin'])

      if (profilesError) throw profilesError

      // Get property counts per admin
      const adminActivitiesData = await Promise.all(
        profiles.map(async (profile) => {
          const { data: properties, error } = await supabase
            .from('properties')
            .select('id, created_at')
            .eq('created_by', profile.user_id)

          const propertyCount = properties?.length || 0
          const lastActivity = properties && properties.length > 0 
            ? properties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : profile.created_at

          return {
            id: profile.user_id,
            user_id: profile.user_id,
            email: `user-${profile.user_id.slice(0, 8)}@example.com`, // Placeholder since we can't access auth.users
            full_name: `Admin User ${profile.user_id.slice(0, 8)}`, // Placeholder
            role: profile.role,
            property_count: propertyCount,
            last_activity: lastActivity,
            total_uploads: 0, // Will be calculated from storage files
            storage_used: 0 // Will be calculated from storage files
          }
        })
      )

      setFiles(storageFiles || [])
      setAdminActivities(adminActivitiesData)
    } catch (error) {
      console.error('Error fetching oversight data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return <HardDrive className="h-4 w-4" />
    if (mimetype.startsWith('image/')) return <FileImage className="h-4 w-4" />
    if (mimetype.startsWith('video/')) return <FileVideo className="h-4 w-4" />
    return <HardDrive className="h-4 w-4" />
  }

  const downloadFile = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('property-media')
        .download(fileName)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading oversight data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Activities Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Admin Activities Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminActivities.map((admin) => (
              <Card key={admin.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{admin.full_name}</span>
                  </div>
                  <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                    {admin.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{admin.email}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span>{admin.property_count} properties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Last activity: {new Date(admin.last_activity).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Storage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Files ({files.length} total)
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.metadata?.mimetype)}
                      <span className="font-medium text-sm truncate" title={file.name}>
                        {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { data } = supabase.storage
                            .from('property-media')
                            .getPublicUrl(file.name)
                          window.open(data.publicUrl, '_blank')
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(file.name)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Size: {formatFileSize(file.metadata?.size || 0)}</p>
                    <p>Type: {file.metadata?.mimetype}</p>
                    <p>Uploaded: {new Date(file.created_at || '').toLocaleDateString()}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No files match your search.' : 'No files uploaded yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

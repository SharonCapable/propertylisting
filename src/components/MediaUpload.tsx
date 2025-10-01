'use client'

import { useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Link, Image, Video, AlertCircle, Plus, Check } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  source: 'upload' | 'url';
  file?: File;
  uploadProgress?: number;
}

interface MediaUploadProps {
  onMediaChange: (media: MediaItem[]) => void;
  initialMedia?: MediaItem[];
  maxFiles?: number;
}

const SUPPORTED_URL_TYPES = [
  { name: 'Direct Image/Video URLs', example: 'https://example.com/image.jpg' },
  { name: 'Google Drive (Public)', example: 'https://drive.google.com/file/d/FILE_ID/view' },
  { name: 'Dropbox (Public)', example: 'https://www.dropbox.com/s/SHARE_ID/file.jpg?dl=0' },
  { name: 'YouTube Videos', example: 'https://www.youtube.com/watch?v=VIDEO_ID' },
  { name: 'Vimeo Videos', example: 'https://vimeo.com/VIDEO_ID' }
];

export function MediaUpload({ onMediaChange, initialMedia = [], maxFiles = 10 }: MediaUploadProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [urlInputs, setUrlInputs] = useState<string[]>(['']);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const updateMedia = (newMedia: MediaItem[]) => {
    setMedia(newMedia);
    onMediaChange(newMedia);
  };

  const validateUrl = (url: string): { isValid: boolean; type: 'image' | 'video' | 'unknown'; processedUrl?: string } => {
    try {
      const urlObj = new URL(url);
      
      // Google Drive URL processing
      if (urlObj.hostname.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          return {
            isValid: true,
            type: 'image', // Assume image for Google Drive
            processedUrl: `https://drive.google.com/uc?export=view&id=${fileId}`
          };
        }
      }
      
      // Dropbox URL processing
      if (urlObj.hostname.includes('dropbox.com')) {
        const processedUrl = url.replace('?dl=0', '?raw=1');
        return {
          isValid: true,
          type: 'image', // Assume image for Dropbox
          processedUrl
        };
      }
      
      // YouTube URL processing
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) {
          return {
            isValid: true,
            type: 'video',
            processedUrl: `https://www.youtube.com/embed/${videoId}`
          };
        }
      }
      
      // Vimeo URL processing
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
        if (videoIdMatch) {
          return {
            isValid: true,
            type: 'video',
            processedUrl: `https://player.vimeo.com/video/${videoIdMatch[1]}`
          };
        }
      }
      
      // Direct file URL detection
      const pathname = urlObj.pathname.toLowerCase();
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(pathname);
      const isVideo = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(pathname);
      
      if (isImage || isVideo) {
        return {
          isValid: true,
          type: isImage ? 'image' : 'video',
          processedUrl: url
        };
      }
      
      return { isValid: false, type: 'unknown' };
    } catch {
      return { isValid: false, type: 'unknown' };
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (media.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const newMediaItems: MediaItem[] = [];
      const totalFiles = files.length;
      let completedFiles = 0;

      // Process files sequentially for better progress tracking
      for (const file of files) {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          setError(`${file.name} is not a valid image or video file`);
          completedFiles++;
          setUploadProgress((completedFiles / totalFiles) * 100);
          continue;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large. Maximum size is 10MB`);
          completedFiles++;
          setUploadProgress((completedFiles / totalFiles) * 100);
          continue;
        }

        try {
          // Generate unique filename with user ID prefix
          const { data: { user } } = await supabase.auth.getUser();
          const fileExt = file.name.split('.').pop();
          const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          // Upload to Supabase Storage
          const { data, error: uploadError } = await supabase.storage
            .from('property-media')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            setError(`Failed to upload ${file.name}: ${uploadError.message}`);
            completedFiles++;
            setUploadProgress((completedFiles / totalFiles) * 100);
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('property-media')
            .getPublicUrl(fileName);

          newMediaItems.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            url: publicUrl,
            type: isImage ? 'image' : 'video',
            source: 'upload',
            file
          });

          completedFiles++;
          setUploadProgress((completedFiles / totalFiles) * 100);
          
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          setError(`Failed to upload ${file.name}`);
          completedFiles++;
          setUploadProgress((completedFiles / totalFiles) * 100);
        }
      }

      // Update media state with all successfully uploaded files
      if (newMediaItems.length > 0) {
        const updatedMedia = [...media, ...newMediaItems];
        updateMedia(updatedMedia);
      }
      
      // Clear error if all files uploaded successfully
      if (newMediaItems.length === totalFiles) {
        setError('');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload files');
    } finally {
      // Reset upload state after a brief delay to show completion
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1500);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addUrlInput = () => {
    if (urlInputs.length < 5) { // Limit to 5 URL inputs at once
      setUrlInputs([...urlInputs, '']);
    }
  };

  const removeUrlInput = (index: number) => {
    if (urlInputs.length > 1) {
      const newInputs = urlInputs.filter((_, i) => i !== index);
      setUrlInputs(newInputs);
    }
  };

  const updateUrlInput = (index: number, value: string) => {
    const newInputs = [...urlInputs];
    newInputs[index] = value;
    setUrlInputs(newInputs);
  };

  const handleUrlsAdd = () => {
    const validUrls = urlInputs.filter(url => url.trim());
    
    if (validUrls.length === 0) return;

    if (media.length + validUrls.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newMediaItems: MediaItem[] = [];
    let hasErrors = false;

    validUrls.forEach(url => {
      const validation = validateUrl(url.trim());
      
      if (!validation.isValid) {
        setError(`Invalid URL: ${url}`);
        hasErrors = true;
        return;
      }

      newMediaItems.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        url: validation.processedUrl || url,
        type: validation.type === 'unknown' ? 'image' : validation.type,
        source: 'url'
      });
    });

    if (!hasErrors) {
      updateMedia([...media, ...newMediaItems]);
      setUrlInputs(['']);
      setError('');
    }
  };

  const handleRemove = async (id: string) => {
    const mediaItem = media.find(m => m.id === id);
    
    // If it's an uploaded file, delete from storage
    if (mediaItem?.source === 'upload') {
      try {
        const fileName = mediaItem.url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('property-media')
            .remove([fileName]);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    updateMedia(media.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={activeTab === 'url' && urlInputs.some(url => url.trim())}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="url" disabled={uploading}>
            <Link className="h-4 w-4 mr-2" />
            Add URLs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || media.length >= maxFiles || activeTab === 'url'}
            className="w-full h-20 border-dashed"
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm">
                {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
              </div>
              <div className="text-xs text-gray-500">
                Images and videos up to 10MB
              </div>
            </div>
          </Button>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-3">
            {urlInputs.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Paste image/video URL here..."
                  value={url}
                  onChange={(e) => updateUrlInput(index, e.target.value)}
                  disabled={media.length >= maxFiles || uploading}
                />
                {urlInputs.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeUrlInput(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={addUrlInput}
                disabled={urlInputs.length >= 5}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another URL
              </Button>
              <Button
                type="button"
                onClick={handleUrlsAdd}
                disabled={!urlInputs.some(url => url.trim()) || media.length >= maxFiles}
              >
                <Check className="h-4 w-4 mr-2" />
                Add URLs
              </Button>
            </div>
          </div>

          {/* Supported URL Types */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Supported URL Types:</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {SUPPORTED_URL_TYPES.map((type, index) => (
                <div key={index}>
                  <span className="font-medium">{type.name}:</span> {type.example}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{media.length}/{maxFiles} files</span>
        <Badge variant="outline">
          {activeTab === 'upload' ? 'Upload Mode' : 'URL Mode'}
        </Badge>
      </div>

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {media.map((item) => (
            <Card key={item.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt="Property media"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      {item.url.includes('youtube.com') || item.url.includes('vimeo.com') ? (
                        <iframe
                          src={item.url}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          controls={false}
                          muted
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Media Type Indicator */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.type === 'image' ? (
                        <><Image className="h-3 w-3 mr-1" />IMG</>
                      ) : (
                        <><Video className="h-3 w-3 mr-1" />VID</>
                      )}
                    </Badge>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* Source Indicator */}
                  <div className="absolute bottom-2 right-2">
                    <Badge variant={item.source === 'upload' ? 'default' : 'outline'} className="text-xs">
                      {item.source === 'upload' ? 'Uploaded' : 'URL'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

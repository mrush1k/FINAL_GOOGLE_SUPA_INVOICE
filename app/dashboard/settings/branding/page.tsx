"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Download, RefreshCw, Upload, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

interface LogoData {
  aiLogoUrl?: string | null
  aiLogoPrompt?: string | null
  aiLogoGeneratedAt?: string | null
  logoUrl?: string | null
}

export default function BrandingPage() {
  const { user, getAuthHeaders } = useAuth()
  const [logoData, setLogoData] = useState<LogoData>({})
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [uploadingCustom, setUploadingCustom] = useState(false)

  useEffect(() => {
    if (user) {
      fetchLogoData()
    }
  }, [user])

  const fetchLogoData = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/users/logo', {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogoData(data)
      }
    } catch (error) {
      console.error('Failed to fetch logo data:', error)
      toast.error('Failed to load logo information')
    } finally {
      setLoading(false)
    }
  }

  const regenerateLogo = async () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter a business name or custom prompt')
      return
    }

    setRegenerating(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/ai-logo', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessName: customPrompt.trim()
        })
      })

      if (response.ok) {
        const newLogoData = await response.json()
        setLogoData(prev => ({
          ...prev,
          aiLogoUrl: newLogoData.logoUrl,
          aiLogoPrompt: newLogoData.prompt,
          aiLogoGeneratedAt: newLogoData.generatedAt
        }))
        toast.success('New AI logo generated successfully!')
      } else {
        toast.error('Failed to generate new logo')
      }
    } catch (error) {
      console.error('Failed to regenerate logo:', error)
      toast.error('Failed to generate new logo')
    } finally {
      setRegenerating(false)
    }
  }

  const downloadLogo = async (logoUrl: string, filename: string) => {
    try {
      // For SVG data URLs, create blob and download
      if (logoUrl.startsWith('data:image/svg+xml')) {
        const link = document.createElement('a')
        link.href = logoUrl
        link.download = filename
        link.click()
        toast.success('Logo downloaded successfully!')
      } else {
        toast.error('Logo format not supported for download')
      }
    } catch (error) {
      console.error('Failed to download logo:', error)
      toast.error('Failed to download logo')
    }
  }

  const handleCustomLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploadingCustom(true)
    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        
        const headers = await getAuthHeaders()
        const response = await fetch('/api/users/logo', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            logoUrl: dataUrl
          })
        })

        if (response.ok) {
          setLogoData(prev => ({ ...prev, logoUrl: dataUrl }))
          toast.success('Custom logo uploaded successfully!')
        } else {
          toast.error('Failed to upload custom logo')
        }
        setUploadingCustom(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload custom logo:', error)
      toast.error('Failed to upload custom logo')
      setUploadingCustom(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Branding</h1>
          <p className="text-muted-foreground">Manage your business logos and branding</p>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-muted-foreground">Manage your business logos and branding</p>
      </div>

      {/* AI-Generated Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI-Generated Logo
          </CardTitle>
          <CardDescription>
            Your automatically generated logo based on your business name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoData.aiLogoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                  <img 
                    src={logoData.aiLogoUrl} 
                    alt="AI Generated Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Prompt:</strong> {logoData.aiLogoPrompt}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Generated:</strong> {logoData.aiLogoGeneratedAt ? 
                      new Date(logoData.aiLogoGeneratedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => downloadLogo(logoData.aiLogoUrl!, 'ai-logo.svg')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={regenerateLogo}
                      disabled={regenerating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                      {regenerating ? 'Generating...' : 'Regenerate'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Custom Business Name / Prompt</Label>
                <div className="flex gap-2">
                  <Input
                    id="customPrompt"
                    placeholder="Enter business name or custom prompt..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                  <Button 
                    onClick={regenerateLogo}
                    disabled={regenerating || !customPrompt.trim()}
                  >
                    <Wand2 className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Wand2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-4">No AI logo generated yet</p>
              <div className="space-y-2">
                <Input
                  placeholder="Enter your business name..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <Button 
                  onClick={regenerateLogo}
                  disabled={regenerating || !customPrompt.trim()}
                >
                  <Wand2 className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? 'Generating...' : 'Generate AI Logo'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Custom Logo
          </CardTitle>
          <CardDescription>
            Upload your own logo to override the AI-generated one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoData.logoUrl ? (
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                <img 
                  src={logoData.logoUrl} 
                  alt="Custom Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">Your custom uploaded logo</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => downloadLogo(logoData.logoUrl!, 'custom-logo.png')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <label className="cursor-pointer flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomLogoUpload}
                        disabled={uploadingCustom}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-4">No custom logo uploaded</p>
              <Button disabled={uploadingCustom}>
                <label className="cursor-pointer flex items-center">
                  <Upload className={`h-4 w-4 mr-2 ${uploadingCustom ? 'animate-spin' : ''}`} />
                  {uploadingCustom ? 'Uploading...' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomLogoUpload}
                    disabled={uploadingCustom}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
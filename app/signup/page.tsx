"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { COUNTRIES } from '@/lib/types'
import { detectUserCountry, getSettingsForCountry } from '@/lib/country-utils'
import { Eye, EyeOff, Building, Upload } from 'lucide-react'
import { SocialLoginButtons } from '@/components/social-login-buttons'
import { Separator } from '@/components/ui/separator'
import { useWorkflowDiagnostics, useFormDiagnostics } from '@/components/diagnostic-provider'

const WORK_TYPE_OPTIONS = [
  { value: 'trades-construction', label: 'Trades & Construction – Builders, electricians, plumbers, painters, etc.' },
  { value: 'creative-digital', label: 'Creative & Digital – Designers, developers, photographers, writers, etc.' },
  { value: 'freelance-consulting', label: 'Freelance & Consulting – Solo operators, consultants, advisors, etc.' },
  { value: 'landscaping-outdoor', label: 'Landscaping & Outdoor Work – Gardeners, landscapers, fencing, etc.' },
  { value: 'retail-sales', label: 'Retail & Sales Services – Sales, personal services, delivery, etc.' },
  { value: 'solo-small-business', label: 'Solo Operator / Small Business – General category for small business owners.' },
  { value: 'other', label: 'Other / Not Listed' },
]

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
    currency: '',
    workType: '',
    customWorkType: '',
    companyName: '',
    businessRegNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    dateFormat: 'DD/MM/YYYY',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp } = useAuth()
  const router = useRouter()
  
  // Diagnostic hooks
  const workflowDiagnostics = useWorkflowDiagnostics('user-signup')
  const formDiagnostics = useFormDiagnostics('signup-form')

  // Auto-detect country on component mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const detectedCountry = await detectUserCountry()
        if (detectedCountry && !formData.country) {
          const settings = getSettingsForCountry(detectedCountry)
          setFormData(prev => ({
            ...prev,
            country: settings.country,
            currency: settings.currency,
            dateFormat: settings.dateFormat
          }))
        }
      } catch (error) {
        console.log('Country detection failed, using defaults')
      }
    }
    
    detectCountry()
  }, [])

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode)
    setFormData({
      ...formData,
      country: countryCode,
      currency: country?.currency || '',
    })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file)
    }
  }

  const getBusinessRegLabel = () => {
    const country = COUNTRIES.find(c => c.code === formData.country)
    return country?.businessRegLabel || 'Business Registration Number'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Run workflow diagnostics before submission
    await workflowDiagnostics.triggerDiagnostics()

    // Validate form fields with diagnostics
    const requiredFields = [
      { name: 'email', value: formData.email, rules: [{ required: true }, { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' }] },
      { name: 'username', value: formData.username, rules: [{ required: true }] },
      { name: 'password', value: formData.password, rules: [{ required: true }] },
      { name: 'country', value: formData.country, rules: [{ required: true }] },
      { name: 'currency', value: formData.currency, rules: [{ required: true }] }
    ]

    let hasValidationErrors = false
    for (const field of requiredFields) {
      const errors = formDiagnostics.validateField(field.name, field.value, field.rules)
      if (errors.length > 0) {
        hasValidationErrors = true
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      formDiagnostics.validateField('confirmPassword', formData.confirmPassword, [])
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      formDiagnostics.validateField('password', formData.password, [])
      return
    }

    if (hasValidationErrors) {
      setError('Please fix the validation errors above')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, {
        username: formData.username,
        country: formData.country,
        currency: formData.currency,
        workType: formData.workType === 'other' ? formData.customWorkType : formData.workType,
        businessName: formData.companyName,
        businessRegNumber: formData.businessRegNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.postalCode,
      })

      if (error) {
        let errorMessage = error.message || 'Failed to create account'
        
        // Provide helpful error messages for common issues
        if (errorMessage.includes('email_address_invalid')) {
          errorMessage = 'Please use a real email address (test emails are not allowed)'
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try logging in instead.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long'
        }
        
        setError(errorMessage)
        formDiagnostics.reportFormSubmission(false, { error: error.message })
        setLoading(false)
      } else {
        formDiagnostics.reportFormSubmission(true, { username: formData.username })
        router.push('/dashboard')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      formDiagnostics.reportFormSubmission(false, { error: errorMessage })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Set up your account</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Social Login Options */}
          <div className="space-y-4 mb-6">
            <SocialLoginButtons 
              isSignUp={true}
              disabled={loading}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email and Password Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-600 uppercase tracking-wide">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                  className="text-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-600 uppercase tracking-wide">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="Choose a username"
                  className="text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-600 uppercase tracking-wide">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter your password"
                    className="text-lg pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-600 uppercase tracking-wide">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm your password"
                    className="text-lg pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Company Logo Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Company Logo (Optional)</Label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {logoFile ? (
                    <img 
                      src={URL.createObjectURL(logoFile)} 
                      alt="Logo preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Label htmlFor="logo" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">Upload Logo</span>
                  </Label>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-600 uppercase tracking-wide">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Jane's Plumbing"
                className="text-lg"
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-gray-600 uppercase tracking-wide">Country of Business</Label>
              <Select value={formData.country} onValueChange={handleCountryChange} required>
                <SelectTrigger className="text-lg">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Registration Number */}
            {formData.country && (
              <div className="space-y-2">
                <Label htmlFor="businessRegNumber" className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {getBusinessRegLabel()}
                </Label>
                <Input
                  id="businessRegNumber"
                  type="text"
                  value={formData.businessRegNumber}
                  onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })}
                  placeholder={formData.country === 'AU' ? '11 digit ABN' : 'Business registration number'}
                  className="text-lg"
                />
              </div>
            )}

            {/* Business Address Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Business Address (Optional)</Label>
              
              <div className="space-y-3">
                <Input
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-lg"
                />
                
                <Input
                  placeholder="Suburb"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="text-lg"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="text-lg"
                  />
                  <Input
                    placeholder="Postcode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Work Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Tell Us What You Do</Label>
              <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })} required>
                <SelectTrigger className="text-lg">
                  <SelectValue placeholder="Select your line of work..." />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.workType === 'other' && (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={formData.customWorkType}
                  onChange={(e) => setFormData({ ...formData, customWorkType: e.target.value })}
                  required
                  placeholder="Enter your work type"
                  className="text-lg"
                />
              </div>
            )}

            {/* Date Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Date Format</Label>
              <Select value={formData.dateFormat} onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}>
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            {/* Next Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 text-lg font-medium rounded-lg"
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Next'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
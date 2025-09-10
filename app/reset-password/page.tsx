"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  
  const router = useRouter()
  const { resetPassword } = useAuth()

  useEffect(() => {
    // Check for auth tokens in URL hash (client-side only)
    const checkAuthTokens = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (accessToken && type === 'recovery') {
          setIsResetMode(true)
          // Set the session with the tokens
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
        }
      }
    }

    checkAuthTokens()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isResetMode) {
      // Handle password update
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message || 'Failed to update password')
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
        // Redirect to login after successful password reset
        setTimeout(() => {
          router.push('/login?message=password-updated')
        }, 2000)
      }
    } else {
      // Handle password reset email
      const { error } = await resetPassword(email)

      if (error) {
        setError(error.message || 'Failed to send reset email')
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
      }
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message || 'Failed to update password')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login?message=password-updated')
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              {isResetMode ? 'Password Updated!' : 'Check your email'}
            </CardTitle>
            <CardDescription className="text-center">
              {isResetMode 
                ? 'Your password has been successfully updated. You can now log in with your new password.'
                : `We've sent a password reset link to ${email}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {!isResetMode && (
                <p className="text-sm text-gray-600">
                  Click the link in the email to reset your password. If you don't see the email, 
                  check your spam folder.
                </p>
              )}
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isResetMode ? 'Go to login' : 'Back to login'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isResetMode ? 'Set new password' : 'Reset your password'}
          </CardTitle>
          <CardDescription className="text-center">
            {isResetMode 
              ? 'Enter your new password below'
              : 'Enter your email address and we\'ll send you a reset link'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isResetMode ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? (isResetMode ? 'Updating...' : 'Sending...') 
                : (isResetMode ? 'Update password' : 'Send reset link')
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-500">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
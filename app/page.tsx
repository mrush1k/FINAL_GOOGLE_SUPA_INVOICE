"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, DollarSign, Clock, CheckCircle, BarChart3, Check, Star } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Invoice Easy</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple Invoice Management 
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional invoice management designed specifically for contractors, tradesmen, 
            and solo business owners. Create, send, and track invoices with ease.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Professional Invoices</CardTitle>
              <CardDescription>
                Create beautiful, professional invoices with auto-generated numbers and customizable templates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Organize your customers with dynamic fields that adapt to different countries and business types.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Payment Tracking</CardTitle>
              <CardDescription>
                Track payments, mark invoices as paid, and generate receipts automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle>Overdue Tracking</CardTitle>
              <CardDescription>
                Never miss a payment with automatic overdue tracking and clear dashboard views.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Multi-Currency Support</CardTitle>
              <CardDescription>
                Work with customers worldwide with support for multiple currencies and country-specific fields.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Simple Dashboard</CardTitle>
              <CardDescription>
                Get a clear overview of your business with organized views of overdue and paid invoices.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your business. All plans include our core features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-center">Free Trial</CardTitle>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">30 Days</div>
                  <div className="text-sm text-gray-500 mt-1">No Credit Card Required</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Access To All Features</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Generate Up to 15 Invoices</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/signup" className="w-full">
                    <Button className="w-full" variant="outline">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="relative border-2 border-blue-500 hover:border-blue-600 transition-colors transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </div>
              </div>
              <CardHeader className="pb-6 pt-8">
                <CardTitle className="text-xl font-bold text-center">Premium</CardTitle>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$9.99</div>
                  <div className="text-sm text-gray-500 mt-1">per month</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Everything In Free Trial +</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">AI-Generated Invoices</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Due Date Reminders</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Summary Report</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/signup" className="w-full">
                    <Button className="w-full">
                      Get Premium
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Yearly */}
            <Card className="relative border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Best Value
                </div>
              </div>
              <CardHeader className="pb-6 pt-8">
                <CardTitle className="text-xl font-bold text-center">Yearly</CardTitle>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$99.99</div>
                  <div className="text-sm text-gray-500 mt-1">per year</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Pay For The Whole Year &</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">Get 2 Months FREE</span>
                  </div>
                  <div className="text-center mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-700 font-medium">
                      Save $20 compared to monthly
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/signup" className="w-full">
                    <Button className="w-full" variant="outline">
                      Choose Yearly
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-blue-600 rounded-2xl px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your invoicing?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of solo operators who trust Invoice Easy to manage their business finances.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Get Started Today
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center text-gray-500">
            <FileText className="h-6 w-6 mr-2" />
            <span>Invoice Easy - Simple invoice management for solo operators</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

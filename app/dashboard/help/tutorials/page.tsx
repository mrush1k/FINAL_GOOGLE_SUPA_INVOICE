"use client"

import { TutorialLibrary } from '@/components/tutorial-library'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Play, Users, Award } from 'lucide-react'

export default function TutorialsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Invoice Easy Tutorials
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Master Invoice Easy with our comprehensive video tutorial library. 
          Learn at your own pace with step-by-step guides for every feature.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Comprehensive Guides</h3>
            <p className="text-sm text-muted-foreground">
              From basics to advanced features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Play className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Short & Focused</h3>
            <p className="text-sm text-muted-foreground">
              Quick 2-5 minute videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-purple-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">For Every Business</h3>
            <p className="text-sm text-muted-foreground">
              Tailored for different industries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Mark tutorials as completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Play className="h-5 w-5" />
            New to Invoice Easy?
          </CardTitle>
          <CardDescription className="text-green-700">
            Start with these essential tutorials to get up and running quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TutorialLibrary 
            compact={true} 
            maxItems={3} 
            category="getting-started" 
            showFilters={false} 
          />
        </CardContent>
      </Card>

      {/* Main Tutorial Library */}
      <TutorialLibrary />

      {/* Additional Help */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Need More Help?</CardTitle>
          <CardDescription className="text-blue-700">
            Can't find what you're looking for? We're here to help!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h4 className="font-medium text-blue-800 mb-2">AI Assistant</h4>
            <p className="text-sm text-blue-700 mb-2">
              Get instant answers to your questions from our AI assistant.
            </p>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Available 24/7
            </Badge>
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-blue-800 mb-2">Personal Tutorial</h4>
            <p className="text-sm text-blue-700 mb-2">
              Get a custom tutorial tailored to your specific business type.
            </p>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              AI-Powered
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
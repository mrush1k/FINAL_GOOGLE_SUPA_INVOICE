"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { TutorialLibrary } from './tutorial-library'
import { CheckCircle, Play, ArrowRight, Users, FileText, DollarSign, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  tutorialCategory?: string
  action?: string
  href?: string
}

export function OnboardingFlow() {
  const { userProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to Invoice Easy!',
      description: 'Get started with the basics of creating and managing invoices.',
      icon: Play,
      completed: false,
      tutorialCategory: 'getting-started'
    },
    {
      id: 'customers',
      title: 'Add Your First Customer',
      description: 'Learn how to add and manage customer information.',
      icon: Users,
      completed: false,
      action: 'Add Customer',
      href: '/dashboard/customers'
    },
    {
      id: 'invoice',
      title: 'Create Your First Invoice',
      description: 'Follow our guide to create professional invoices.',
      icon: FileText,
      completed: false,
      tutorialCategory: 'invoicing',
      action: 'Create Invoice',
      href: '/dashboard/invoices/new'
    },
    {
      id: 'settings',
      title: 'Configure Your Settings',
      description: 'Set up your business information and preferences.',
      icon: Settings,
      completed: false,
      action: 'View Settings',
      href: '/dashboard/settings'
    },
    {
      id: 'payments',
      title: 'Set Up Payment Methods',
      description: 'Configure how customers can pay their invoices.',
      icon: DollarSign,
      completed: false,
      tutorialCategory: 'payments'
    }
  ])

  useEffect(() => {
    // Check if user is new and hasn't completed onboarding
    if (userProfile && !userProfile.onboardingCompleted) {
      setIsOpen(true)
    }
  }, [userProfile])

  const completedSteps = steps.filter(step => step.completed).length
  const progressPercentage = (completedSteps / steps.length) * 100

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    ))
    
    // Move to next step if not at the end
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleSkipOnboarding = async () => {
    // Mark onboarding as completed
    try {
      // Use Supabase cookie-based auth instead of JWT token
      await fetch('/api/users/onboarding-complete', {
        method: 'POST'
        // No Authorization header needed with Supabase cookie auth
      })
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error)
    }
    setIsOpen(false)
  }

  const handleFinishOnboarding = async () => {
    await handleSkipOnboarding()
  }

  if (!userProfile || userProfile.onboardingCompleted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkipOnboarding()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Welcome to Invoice Easy!</DialogTitle>
              <DialogDescription>
                Let's get you set up with everything you need to start invoicing like a pro.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{completedSteps} of {steps.length} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Step */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {React.createElement(steps[currentStep]?.icon, { className: "h-5 w-5 text-blue-600" })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {steps[currentStep]?.title}
                    <Badge variant="secondary">Step {currentStep + 1}</Badge>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>
                {steps[currentStep]?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps[currentStep]?.tutorialCategory && (
                  <div>
                    <h4 className="font-medium mb-3">Quick Tutorial</h4>
                    <TutorialLibrary 
                      compact={true} 
                      maxItems={1} 
                      category={steps[currentStep].tutorialCategory}
                      showFilters={false} 
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t">
                  {steps[currentStep]?.href && (
                    <Button 
                      onClick={() => {
                        window.open(steps[currentStep].href, '_blank')
                        handleStepComplete(steps[currentStep].id)
                      }}
                    >
                      {steps[currentStep].action}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleStepComplete(steps[currentStep].id)}
                  >
                    {steps[currentStep]?.completed ? 'Next Step' : 'Mark Complete'}
                  </Button>

                  {currentStep === steps.length - 1 && (
                    <Button 
                      variant="default" 
                      onClick={handleFinishOnboarding}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finish Setup
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Steps Overview */}
          <div className="space-y-3">
            <h3 className="font-medium">Setup Checklist</h3>
            <div className="grid grid-cols-1 gap-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    step.completed 
                      ? 'bg-green-50 border-green-200' 
                      : index === currentStep
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`p-1.5 rounded ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : index === currentStep
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      React.createElement(step.icon, { className: "h-4 w-4" })
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>

                  {index === currentStep && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                  
                  {step.completed && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      Done
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skip Option */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Already familiar with Invoice Easy?
            </p>
            <Button variant="ghost" size="sm" onClick={handleSkipOnboarding}>
              Skip onboarding for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
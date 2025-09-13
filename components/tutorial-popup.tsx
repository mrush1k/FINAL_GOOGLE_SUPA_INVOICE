"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  PlayCircle, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Clock,
  CheckCircle,
  Target
} from 'lucide-react'
import { Tutorial, TutorialStep, generateTutorialForUser } from '@/lib/ai-tutorial'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface TutorialPopupProps {
  open: boolean
  onClose: () => void
  onComplete?: () => void
  tutorial?: Tutorial | null
}

export function TutorialPopup({ open, onClose, onComplete, tutorial: propTutorial }: TutorialPopupProps) {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (propTutorial) {
      setTutorial(propTutorial)
    } else if (userProfile && !propTutorial) {
      const generatedTutorial = generateTutorialForUser(userProfile)
      setTutorial(generatedTutorial)
    }
  }, [propTutorial, userProfile])

  useEffect(() => {
    if (open) {
      setCurrentStep(0)
    }
  }, [open])

  const handleNext = async () => {
    if (!tutorial || !userProfile) return

    if (currentStep < tutorial.steps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      
      // Update progress in database with Supabase cookie auth
      try {
        await fetch('/api/tutorials/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tutorialId: tutorial.id,
            currentStep: nextStep,
            completed: false
          })
        })
      } catch (error) {
        console.error('Failed to update tutorial progress:', error)
      }
    } else {
      // Tutorial completed
      await handleComplete()
    }
  }

  const handlePrevious = async () => {
    if (!tutorial || !userProfile) return

    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      
      // Update progress in database with Supabase cookie auth
      try {
        await fetch('/api/tutorials/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tutorialId: tutorial.id,
            currentStep: prevStep,
            completed: false
          })
        })
      } catch (error) {
        console.error('Failed to update tutorial progress:', error)
      }
    }
  }

  const handleComplete = async () => {
    if (!tutorial || !userProfile) return

    setLoading(true)
    try {
      // Mark tutorial as completed with Supabase cookie auth
      await fetch('/api/tutorials/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorialId: tutorial.id,
          currentStep: tutorial.steps.length - 1,
          completed: true,
          completedAt: new Date().toISOString()
        })
      })
      onComplete?.()
      onClose()
    } catch (error) {
      console.error('Failed to complete tutorial:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActionButton = async (step: TutorialStep) => {
    if (!step.actionButton) return

    const action = step.actionButton.action
    
    if (action === 'next') {
      handleNext()
    } else if (action === 'complete') {
      handleComplete()
    } else if (action.startsWith('navigate:')) {
      const route = action.replace('navigate:', '')
      
      // Close tutorial first
      onClose()
      
      // Navigate after a short delay to allow dialog to close
      setTimeout(() => {
        router.push(route)
      }, 300)
    }
  }

  const handleSkip = async () => {
    if (!tutorial || !userProfile) return

    setLoading(true)
    try {
      // Mark tutorial as completed but skipped with Supabase cookie auth
      await fetch('/api/tutorials/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorialId: tutorial.id,
          currentStep: currentStep,
          completed: true,
          completedAt: new Date().toISOString()
        })
      })
      onClose()
    } catch (error) {
      console.error('Failed to skip tutorial:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!tutorial) return null

  const currentTutorialStep = tutorial.steps[currentStep]
  const progress = ((currentStep + 1) / tutorial.steps.length) * 100
  const isLastStep = currentStep === tutorial.steps.length - 1

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-6 h-6 text-blue-600" />
              <DialogTitle className="text-xl font-bold">
                {tutorial.title}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{tutorial.estimatedTime} min tutorial</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1} of {tutorial.steps.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={loading}>
              Skip Tutorial
            </Button>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">{tutorial.description}</p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Step Content */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentTutorialStep.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {currentTutorialStep.description}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 whitespace-pre-line">
                  {currentTutorialStep.content}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 || loading}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              {currentStep < tutorial.steps.length - 1 && (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  size="sm"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Action Button */}
            {currentTutorialStep.actionButton && (
              <Button
                onClick={() => handleActionButton(currentTutorialStep)}
                disabled={loading}
                className={isLastStep ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isLastStep && <CheckCircle className="w-4 h-4 mr-1" />}
                {currentTutorialStep.actionButton.text}
              </Button>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2 pt-4">
            {tutorial.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
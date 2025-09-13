"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { TutorialPopup } from '@/components/tutorial-popup'
import { generateTutorialForUser } from '@/lib/ai-tutorial'

interface TutorialProgress {
  id: string
  userId: string
  tutorialId: string
  completed: boolean
  currentStep: number
  completedAt?: Date
  createdAt: Date
}

interface TutorialContextType {
  showTutorial: (delay?: number) => void
  hideTutorial: () => void
  isNewUser: boolean
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, loading: authLoading } = useAuth()
  const [showTutorialPopup, setShowTutorialPopup] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false)

  useEffect(() => {
    if (authLoading || !userProfile || hasCheckedTutorial) return

    const checkAndShowTutorial = async () => {
      try {
        const tutorial = generateTutorialForUser(userProfile)
        if (!tutorial) return

        // Get tutorial progress using Supabase cookie auth
        const response = await fetch(`/api/tutorials/progress?tutorialId=${tutorial.id}`)
        let progress: TutorialProgress | null = null
        if (response.ok) {
          progress = await response.json()
        }
        
        const shouldShowTutorial = !progress || !progress.completed
        
        setIsNewUser(!progress)
        setHasCheckedTutorial(true)

        // Show tutorial for new users or if they haven't completed it
        // Only show automatically for truly new users (no progress record)
        if (!progress && userProfile.createdAt) {
          const createdAt = new Date(userProfile.createdAt)
          const now = new Date()
          const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
          
          // Show tutorial if user was created within the last 10 minutes (fresh signup)
          if (diffMinutes <= 10) {
            setTimeout(() => {
              setShowTutorialPopup(true)
            }, 2000) // Show after 2 seconds to let dashboard load
          }
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error)
        setHasCheckedTutorial(true)
      }
    }

    checkAndShowTutorial()
  }, [userProfile, authLoading, hasCheckedTutorial])

  const showTutorial = (delay: number = 0) => {
    if (delay > 0) {
      setTimeout(() => setShowTutorialPopup(true), delay)
    } else {
      setShowTutorialPopup(true)
    }
  }

  const hideTutorial = () => {
    setShowTutorialPopup(false)
  }

  const contextValue: TutorialContextType = {
    showTutorial,
    hideTutorial,
    isNewUser
  }

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      <TutorialPopup
        open={showTutorialPopup}
        onClose={hideTutorial}
        onComplete={() => {
          setIsNewUser(false)
          hideTutorial()
        }}
      />
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}
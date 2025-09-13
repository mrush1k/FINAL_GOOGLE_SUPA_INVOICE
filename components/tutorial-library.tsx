"use client"

import { useState, useEffect } from 'react'
import { TutorialVideo } from './tutorial-video'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Search, Filter, BookOpen, Play, CheckCircle } from 'lucide-react'

const SAMPLE_TUTORIALS: TutorialVideo[] = [
  {
    id: '1',
    title: 'Creating Your First Invoice',
    description: 'Learn how to create professional invoices with our easy-to-use invoice builder. Perfect for beginners.',
    duration: '3:45',
    category: 'invoicing',
    difficulty: 'beginner',
    thumbnailUrl: '/tutorials/create-invoice-thumb.jpg',
    completed: false
  },
  {
    id: '2',
    title: 'Setting Up Payment Methods',
    description: 'Configure your preferred payment methods and make it easy for customers to pay you.',
    duration: '2:30',
    category: 'payments',
    difficulty: 'beginner',
    thumbnailUrl: '/tutorials/payment-methods-thumb.jpg',
    completed: false
  },
  {
    id: '3',
    title: 'Customizing Invoice Templates',
    description: 'Personalize your invoices with custom templates, colors, and branding.',
    duration: '4:20',
    category: 'invoicing',
    difficulty: 'intermediate',
    thumbnailUrl: '/tutorials/customize-templates-thumb.jpg',
    completed: false
  },
  {
    id: '4',
    title: 'Managing Customer Information',
    description: 'Organize your customers efficiently and build lasting business relationships.',
    duration: '3:15',
    category: 'getting-started',
    difficulty: 'beginner',
    completed: false
  },
  {
    id: '5',
    title: 'Advanced Settings Configuration',
    description: 'Configure tax rates, currencies, and regional settings for your business.',
    duration: '5:10',
    category: 'settings',
    difficulty: 'intermediate',
    completed: false
  },
  {
    id: '6',
    title: 'Tracking Payments and Overdue Invoices',
    description: 'Learn how to track payments, send reminders, and manage overdue invoices effectively.',
    duration: '4:35',
    category: 'payments',
    difficulty: 'intermediate',
    completed: false
  }
]

interface TutorialLibraryProps {
  compact?: boolean
  showFilters?: boolean
  maxItems?: number
  category?: string
}

export function TutorialLibrary({ 
  compact = false, 
  showFilters = true, 
  maxItems,
  category 
}: TutorialLibraryProps) {
  const [tutorials, setTutorials] = useState<TutorialVideo[]>(SAMPLE_TUTORIALS)
  const [filteredTutorials, setFilteredTutorials] = useState<TutorialVideo[]>(SAMPLE_TUTORIALS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(category || 'all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Fetch tutorial completion status using Supabase cookie auth
  useEffect(() => {
    async function fetchTutorialProgress() {
      try {
        // Fetch progress for each tutorial in parallel
        const responses = await Promise.all(
          SAMPLE_TUTORIALS.map(tutorial => 
            fetch(`/api/tutorials/progress?tutorialId=${tutorial.id}`)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          )
        )
        
        // Update completion status based on responses
        const completedIds = new Set<string>()
        responses.forEach((res, index) => {
          if (res && res.completed) {
            completedIds.add(SAMPLE_TUTORIALS[index].id)
          }
        })
        
        setCompletedTutorials(completedIds)
        
        // Update tutorial list with completion status
        setTutorials(SAMPLE_TUTORIALS.map(tutorial => ({
          ...tutorial,
          completed: completedIds.has(tutorial.id)
        })))
      } catch (error) {
        console.error('Error fetching tutorial progress:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTutorialProgress()
  }, [])

  useEffect(() => {
    let filtered = tutorials

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tutorial =>
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.category === selectedCategory)
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.difficulty === selectedDifficulty)
    }

    // Apply max items limit
    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }

    setFilteredTutorials(filtered)
  }, [tutorials, searchQuery, selectedCategory, selectedDifficulty, maxItems])

  const handleTutorialComplete = async (tutorialId: string) => {
    try {
      // Use Supabase cookie auth to save completion status
      await fetch('/api/tutorials/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorialId,
          currentStep: 100,
          completed: true,
          completedAt: new Date().toISOString()
        })
      })

      // Update local state
      setCompletedTutorials(prev => new Set(prev).add(tutorialId))
      setTutorials(prev => prev.map(tutorial =>
        tutorial.id === tutorialId ? { ...tutorial, completed: true } : tutorial
      ))
    } catch (error) {
      console.error('Error marking tutorial as complete:', error)
    }
  }

  const completionStats = {
    total: tutorials.length,
    completed: completedTutorials.size,
    percentage: tutorials.length > 0 ? Math.round((completedTutorials.size / tutorials.length) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Tutorial Library
            </h2>
            <p className="text-muted-foreground">
              Learn how to make the most of Invoice Easy with our step-by-step tutorials.
            </p>
          </div>

          {completionStats.total > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{completionStats.completed}/{completionStats.total}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">Progress:</div>
                    <Badge variant="secondary">{completionStats.percentage}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="getting-started">Getting Started</SelectItem>
              <SelectItem value="invoicing">Invoicing</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredTutorials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tutorials found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find relevant tutorials.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
          {filteredTutorials.map((tutorial) => (
            <TutorialVideo
              key={tutorial.id}
              video={tutorial}
              onComplete={handleTutorialComplete}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  )
}
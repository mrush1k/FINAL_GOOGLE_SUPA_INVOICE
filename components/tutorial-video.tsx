"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Play, CheckCircle, Clock, ExternalLink } from 'lucide-react'

export interface TutorialVideo {
  id: string
  title: string
  description: string
  duration: string
  videoUrl?: string
  thumbnailUrl?: string
  category: 'invoicing' | 'payments' | 'settings' | 'getting-started'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completed?: boolean
}

interface TutorialVideoProps {
  video: TutorialVideo
  onComplete?: (videoId: string) => void
  compact?: boolean
}

export function TutorialVideo({ video, onComplete, compact = false }: TutorialVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = async () => {
    setIsPlaying(true)
    
    // In a real implementation, you would track video completion
    // Update tutorial progress with Supabase cookie auth
    try {
      setTimeout(async () => {
        // Mark tutorial as completed with Supabase cookie auth
        await fetch('/api/tutorials/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tutorialId: video.id,
            currentStep: 100,
            completed: true,
            completedAt: new Date().toISOString()
          })
        })
        
        // Notify parent component about completion
        onComplete?.(video.id)
      }, 2000) // Simulate video completion after 2 seconds
    } catch (error) {
      console.error('Failed to mark tutorial as complete:', error)
    }
  }

  const categoryColors = {
    'invoicing': 'bg-blue-100 text-blue-800',
    'payments': 'bg-green-100 text-green-800',
    'settings': 'bg-purple-100 text-purple-800',
    'getting-started': 'bg-orange-100 text-orange-800'
  }

  const difficultyColors = {
    'beginner': 'bg-emerald-100 text-emerald-800',
    'intermediate': 'bg-yellow-100 text-yellow-800',
    'advanced': 'bg-red-100 text-red-800'
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
        <div className="flex-shrink-0">
          {video.completed ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <Play className="h-6 w-6 text-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {video.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{video.duration}</span>
            <Badge variant="secondary" className={`text-xs ${categoryColors[video.category]}`}>
              {video.category}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          disabled={video.completed}
        >
          {video.completed ? 'Completed' : 'Watch'}
        </Button>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <Play className="h-16 w-16 text-blue-500" />
          </div>
        )}
        
        {video.completed && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
          </div>
        )}

        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white">
            {video.duration}
          </Badge>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              onClick={handlePlay}
              className="bg-white/90 hover:bg-white text-blue-600 shadow-lg"
              disabled={video.completed}
            >
              <Play className="h-6 w-6 mr-2" />
              {video.completed ? 'Completed' : 'Watch Now'}
            </Button>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{video.title}</CardTitle>
          <div className="flex space-x-2">
            <Badge className={categoryColors[video.category]}>
              {video.category.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className={difficultyColors[video.difficulty]}>
              {video.difficulty}
            </Badge>
          </div>
        </div>
        <CardDescription>{video.description}</CardDescription>
      </CardHeader>

      {video.videoUrl && (
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
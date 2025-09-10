"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  Loader2, 
  User, 
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  action?: {
    type: 'invoice_created' | 'customer_added' | 'invoice_paid'
    data?: any
  }
}

interface ChatbotProps {
  onActionComplete?: (action: string, data: any) => void
}

export function AiChatbot({ onActionComplete }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI assistant. I can help you create invoices, add customers, mark invoices as paid, and answer questions about using Invoice Easy. What would you like to do?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasReminders, setHasReminders] = useState(false)
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognition = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check for reminders when component mounts
    checkForReminders()
    
    // Set up periodic reminder checks (every 30 minutes)
    const reminderInterval = setInterval(checkForReminders, 30 * 60 * 1000)
    
    return () => clearInterval(reminderInterval)
  }, [userProfile?.id])

  const checkForReminders = async () => {
    if (!userProfile?.id) return
    
    try {
      const response = await fetch(`/api/chatbot/reminders?userId=${userProfile.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.reminders && data.reminders.length > 0) {
          setHasReminders(true)
          
          // Add reminders as system messages
          data.reminders.forEach((reminder: any) => {
            addMessage('system', `📢 ${reminder.title}\n\n${reminder.message}`)
          })
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error)
    }
  }

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'
      
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      
      recognition.current.onerror = () => {
        setIsListening(false)
      }
    }
  }, [])

  const addMessage = (type: 'user' | 'bot' | 'system', content: string, action?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      action
    }
    setMessages(prev => [...prev, newMessage])
  }

  const processCommand = async (userInput: string) => {
    setIsProcessing(true)
    
    try {
      // Call AI processing API
      const response = await fetch('/api/chatbot/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userInput,
          userId: userProfile?.id 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process command')
      }

      const result = await response.json()
      
      // Add bot response
      addMessage('bot', result.response, result.action)
      
      // Execute action if specified
      if (result.action) {
        const actionResult = await executeAction(result.action)
        if (actionResult.success) {
          addMessage('system', actionResult.message)
        } else {
          addMessage('bot', actionResult.message)
        }
        
        if (onActionComplete) {
          onActionComplete(result.action.type, result.action.data)
        }
      }

      // Log interaction
      await logInteraction(userInput, result.response, result.action)
      
    } catch (error) {
      console.error('Error processing command:', error)
      addMessage('bot', "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.")
    } finally {
      setIsProcessing(false)
    }
  }

  const executeAction = async (action: any) => {
    try {
      const response = await fetch('/api/chatbot/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: action.type,
          data: action.data,
          userId: userProfile?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to execute action')
      }

      return await response.json()
    } catch (error) {
      console.error('Error executing action:', error)
      return {
        success: false,
        message: 'Failed to execute action. Please try again.'
      }
    }
  }

  const logInteraction = async (userMessage: string, botResponse: string, action?: any) => {
    try {
      await fetch('/api/chatbot/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile?.id,
          userMessage,
          botResponse,
          action,
          timestamp: new Date().toISOString()
        }),
      })
    } catch (error) {
      console.error('Error logging interaction:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    addMessage('user', userMessage)
    
    // Process command
    await processCommand(userMessage)
  }

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true)
      recognition.current.start()
    }
  }

  const getActionIcon = (action?: ChatMessage['action']) => {
    if (!action) return null
    
    switch (action.type) {
      case 'invoice_created':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'customer_added':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'invoice_paid':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      default:
        return null
    }
  }

  const formatActionText = (action?: ChatMessage['action']) => {
    if (!action) return null
    
    switch (action.type) {
      case 'invoice_created':
        return `Invoice #${action.data?.invoiceNumber} created`
      case 'customer_added':
        return `Customer "${action.data?.customerName}" added`
      case 'invoice_paid':
        return `Invoice #${action.data?.invoiceNumber} marked as paid`
      default:
        return null
    }
  }

  return (
    <>
      {/* Floating Chatbot Icon */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
            size="sm"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          {hasReminders && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.type === 'system'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg p-3`}>
                        <div className="flex items-start gap-2">
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            {message.action && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                                {getActionIcon(message.action)}
                                <span className="text-xs opacity-90">
                                  {formatActionText(message.action)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Processing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Form */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything or give me a command..."
                      disabled={isProcessing}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={startListening}
                      disabled={isProcessing || isListening}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : 'text-gray-400'}`} />
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!input.trim() || isProcessing}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setInput('Create an invoice')}
                  >
                    Create Invoice
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setInput('Add a new customer')}
                  >
                    Add Customer
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setInput('How do I send an invoice?')}
                  >
                    Help
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
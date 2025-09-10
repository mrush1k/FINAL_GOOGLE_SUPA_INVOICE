"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Mic, MicOff, Play, Pause, CalendarIcon, Send, Save, Edit3, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Customer } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { voiceCache, isOnline, onNetworkChange } from '@/lib/voice-cache'

interface VoiceInvoiceData {
  customer?: string
  amount?: number
  currency?: string
  description?: string
  dueDate?: Date
  invoiceDate?: Date
  poNumber?: string
  quantity?: number
  unitPrice?: number
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
  readonly resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message?: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
]

export default function VoiceInvoice() {
  const { user, userProfile, getAuthHeaders } = useAuth()
  const { toast } = useToast()
  
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [voiceData, setVoiceData] = useState<VoiceInvoiceData>({})
  const [isEditing, setIsEditing] = useState(false)
  const [browserSupported, setBrowserSupported] = useState(false)
  const [isOffline, setIsOffline] = useState(!isOnline())
  const [pendingCommands, setPendingCommands] = useState(0)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setBrowserSupported(true)
      recognitionRef.current = new SpeechRecognition()
      const recognition = recognitionRef.current
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)
        
        if (finalTranscript) {
          processVoiceCommand(finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        switch (event.error) {
          case 'not-allowed':
            toast({
              title: "Microphone Access Denied",
              description: "Please allow microphone access in your browser settings and try again",
              variant: "destructive",
            })
            break
          case 'network':
            toast({
              title: "Network Error", 
              description: "Speech recognition requires internet connection. Please check your connection and try again",
              variant: "destructive",
            })
            break
          case 'no-speech':
            toast({
              title: "No Speech Detected",
              description: "I didn't catch anything. Please speak clearly and try again",
              variant: "default",
            })
            break
          case 'audio-capture':
            toast({
              title: "Audio Capture Error",
              description: "Please check your microphone connection and try again",
              variant: "destructive",
            })
            break
          case 'aborted':
            toast({
              title: "Voice Recognition Stopped",
              description: "Voice recognition was cancelled. Click the microphone to try again",
              variant: "default",
            })
            break
          default:
            toast({
              title: "Voice Recognition Error",
              description: `Error: ${event.error}. Please try again or type your command manually`,
              variant: "destructive",
            })
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    } else {
      setBrowserSupported(false)
      toast({
        title: "Browser Not Supported",
        description: "Voice recognition is only supported in Chrome and Safari browsers",
        variant: "destructive",
      })
    }

    if (user) {
      fetchCustomers()
      updatePendingCommands()
    }

    // Network status monitoring
    const unsubscribe = onNetworkChange((online) => {
      setIsOffline(!online)
      if (online) {
        processPendingCommands()
      }
    })

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      unsubscribe()
    }
  }, [user])

  const fetchCustomers = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/customers', { headers })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && browserSupported) {
      recognitionRef.current.start()
      setTranscript('')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const updatePendingCommands = () => {
    const count = voiceCache.getCommandCount()
    setPendingCommands(count.pending)
  }

  const processPendingCommands = async () => {
    const pending = voiceCache.getPendingCommands()
    for (const command of pending) {
      if (command.invoiceData) {
        try {
          await createInvoiceFromCachedData(command.invoiceData)
          voiceCache.markAsProcessed(command.id)
          toast({
            title: "Offline Invoice Created",
            description: "Successfully created invoice from cached voice command",
          })
        } catch (error) {
          console.error('Error processing cached command:', error)
        }
      }
    }
    updatePendingCommands()
  }

  const processVoiceCommand = (command: string) => {
    setIsProcessing(true)
    
    // Cache the command if offline
    if (isOffline) {
      voiceCache.saveCommand(command)
      updatePendingCommands()
      toast({
        title: "Command Cached",
        description: "Voice command saved offline. Will process when connection is restored.",
        variant: "default",
      })
      setIsProcessing(false)
      return
    }
    
    // Simple NLP parsing for invoice entities
    const lowerCommand = command.toLowerCase()
    const newData: VoiceInvoiceData = { ...voiceData }

    // Extract customer name
    const customerMatch = lowerCommand.match(/(?:invoice|bill)\s+(?:to|for)\s+([^,]+?)(?:\s+for|\s+\$|\s+,|$)/)
    if (customerMatch) {
      const customerName = customerMatch[1].trim()
      newData.customer = customerName
    }

    // Extract amount
    const amountMatch = lowerCommand.match(/\$?(\d+(?:\.\d{2})?|\d+)\s*(?:dollars?|bucks?|$)?/)
    if (amountMatch) {
      newData.amount = parseFloat(amountMatch[1])
    }

    // Extract currency (override only if explicitly mentioned)
    const currencyMatch = lowerCommand.match(/\b(?:create in |in |use )(usd|aud|eur|gbp|cad|nzd|dollars?|euros?|pounds?)\b/)
    if (currencyMatch) {
      const curr = currencyMatch[1].toLowerCase()
      if (curr.includes('dollar') || curr === 'usd') newData.currency = 'USD'
      else if (curr.includes('euro') || curr === 'eur') newData.currency = 'EUR'
      else if (curr.includes('pound') || curr === 'gbp') newData.currency = 'GBP'
      else if (curr === 'aud') newData.currency = 'AUD'
      else if (curr === 'cad') newData.currency = 'CAD'
      else if (curr === 'nzd') newData.currency = 'NZD'
    } else if (!newData.currency) {
      // Use user's default currency if not explicitly specified
      newData.currency = userProfile?.currency || 'USD'
    }

    // Extract description/service
    const serviceMatch = lowerCommand.match(/for\s+([^,]+?)(?:\s+due|\s+\$|\s+,|$)/)
    if (serviceMatch) {
      newData.description = serviceMatch[1].trim()
    }

    // Extract due date
    const dueDatePatterns = [
      /due\s+in\s+(\d+)\s+days?/,
      /due\s+next\s+(week|month|friday|monday|tuesday|wednesday|thursday|saturday|sunday)/,
      /due\s+(today|tomorrow)/,
      /net\s+(\d+)/
    ]

    for (const pattern of dueDatePatterns) {
      const match = lowerCommand.match(pattern)
      if (match) {
        const today = new Date()
        if (match[1]) {
          if (match[1] === 'today') {
            newData.dueDate = today
          } else if (match[1] === 'tomorrow') {
            newData.dueDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
          } else if (!isNaN(parseInt(match[1]))) {
            const days = parseInt(match[1])
            newData.dueDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
          } else if (match[1] === 'week') {
            newData.dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          } else if (match[1] === 'month') {
            newData.dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        }
        break
      }
    }

    setVoiceData(newData)
    setIsProcessing(false)

    // Provide feedback
    toast({
      title: "Voice Command Processed",
      description: "Invoice details have been extracted from your voice command",
    })
  }

  const createInvoiceFromCachedData = async (invoiceData: any) => {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers,
      body: JSON.stringify(invoiceData),
    })

    if (!response.ok) {
      throw new Error('Failed to create invoice from cached data')
    }

    return response.json()
  }

  const createInvoiceFromVoice = async () => {
    if (!voiceData.customer || !voiceData.amount) {
      toast({
        title: "Incomplete Information",
        description: "Please provide at least customer name and amount",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // If offline, cache the invoice data
    if (isOffline) {
      const invoiceData = prepareInvoiceData()
      voiceCache.saveCommand(transcript, invoiceData)
      updatePendingCommands()
      toast({
        title: "Invoice Cached",
        description: "Invoice data saved offline. Will be created when connection is restored.",
      })
      setIsProcessing(false)
      return
    }

    try {
      const invoiceData = await prepareInvoiceData()
      if (!invoiceData) return

      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const invoice = await response.json()
        toast({
          title: "Success",
          description: "Voice invoice created successfully!",
        })
        
        // Reset form
        setVoiceData({})
        setTranscript('')
        
        // Redirect to invoice page
        window.location.href = `/dashboard/invoices/${invoice.id}`
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating voice invoice:', error)
      toast({
        title: "Error",
        description: "Failed to create invoice from voice command",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const prepareInvoiceData = async () => {
    // Find or suggest customer
    let customerId: string | null = null
    const matchingCustomer = customers.find(c => 
      c.displayName.toLowerCase().includes(voiceData.customer!.toLowerCase()) ||
      voiceData.customer!.toLowerCase().includes(c.displayName.toLowerCase())
    )

    if (matchingCustomer) {
      customerId = matchingCustomer.id
    } else {
      toast({
        title: "Customer Not Found",
        description: `Customer "${voiceData.customer}" not found. Please select from existing customers or add them first.`,
        variant: "destructive",
      })
      setIsProcessing(false)
      return null
    }

    // Get next invoice number
    const headers = await getAuthHeaders()
    const numberResponse = await fetch('/api/invoices/next-number', { headers })
    const { nextNumber } = await numberResponse.json()

    return {
      number: nextNumber,
      customerId,
      currency: voiceData.currency || userProfile?.currency || 'USD',
      invoiceDate: (voiceData.invoiceDate || new Date()).toISOString(),
      dueDate: (voiceData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString(),
      poNumber: voiceData.poNumber || null,
      notes: `Created via voice command: "${transcript}"`,
      subtotal: voiceData.amount,
      total: voiceData.amount,
      status: 'DRAFT',
      items: [{
        description: voiceData.description || 'Service',
        quantity: voiceData.quantity || 1,
        unitPrice: voiceData.unitPrice || voiceData.amount,
        total: voiceData.amount
      }]
    }
  }

  const formatCurrency = (amount: number) => {
    const currency = voiceData.currency || userProfile?.currency || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  if (!browserSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="w-5 h-5" />
            Voice Invoicing Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Voice invoicing requires a modern browser with speech recognition support. 
            Please use Chrome or Safari to access this feature.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Voice Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Invoice Creator
            {isOffline && (
              <Badge variant="destructive" className="ml-2">Offline</Badge>
            )}
            {pendingCommands > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCommands} cached
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Tap the microphone and say something like: "Create an invoice for John Smith, $250 for pipe repair, due in 7 days"
            {isOffline && (
              <span className="block text-amber-600 mt-1">
                Offline mode: Commands will be processed when connection is restored
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className="w-24 h-24 rounded-full"
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>
          
          {isListening && (
            <div className="flex justify-center">
              <span className="text-sm text-blue-600 animate-pulse">Listening...</span>
            </div>
          )}

          {transcript && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium">Transcript:</Label>
              <p className="text-sm mt-1">{transcript}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Invoice Data */}
      {Object.keys(voiceData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Invoice Preview</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                {isEditing ? (
                  <Select 
                    value={customers.find(c => c.displayName.toLowerCase().includes(voiceData.customer?.toLowerCase() || ''))?.id || ''} 
                    onValueChange={(value) => {
                      const customer = customers.find(c => c.id === value)
                      setVoiceData({...voiceData, customer: customer?.displayName})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded">{voiceData.customer || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label>Amount</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={voiceData.amount || ''}
                    onChange={(e) => setVoiceData({...voiceData, amount: parseFloat(e.target.value) || 0})}
                  />
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {voiceData.amount ? formatCurrency(voiceData.amount) : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label>Currency</Label>
                {isEditing ? (
                  <Select value={voiceData.currency || ''} onValueChange={(value) => setVoiceData({...voiceData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded">{voiceData.currency || userProfile?.currency || 'USD'}</p>
                )}
              </div>

              <div>
                <Label>Due Date</Label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {voiceData.dueDate ? format(voiceData.dueDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={voiceData.dueDate}
                        onSelect={(date) => setVoiceData({...voiceData, dueDate: date})}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {voiceData.dueDate ? format(voiceData.dueDate, "PPP") : 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Description/Service</Label>
              {isEditing ? (
                <Textarea
                  value={voiceData.description || ''}
                  onChange={(e) => setVoiceData({...voiceData, description: e.target.value})}
                  placeholder="Service description"
                />
              ) : (
                <p className="text-sm bg-gray-50 p-2 rounded">{voiceData.description || 'Not specified'}</p>
              )}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={createInvoiceFromVoice}
                disabled={isProcessing || !voiceData.customer || !voiceData.amount}
                className="flex-1"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setVoiceData({})
                  setTranscript('')
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
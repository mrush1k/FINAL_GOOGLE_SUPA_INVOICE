"use client"

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VoiceInvoice from '@/components/voice-invoice'

export default function VoiceInvoicePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Voice AI Invoicing</h1>
        </div>
      </div>

      <div className="text-center mb-8">
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Create invoices using voice commands. Simply speak naturally and our AI will extract 
          the invoice details for you to review and create.
        </p>
      </div>

      <VoiceInvoice />
    </div>
  )
}
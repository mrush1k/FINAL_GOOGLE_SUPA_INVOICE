"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'

interface LazyPDFProps {
  invoiceData: any
  onGeneratePDF: () => Promise<void>
  loading?: boolean
}

export function LazyPDF({ invoiceData, onGeneratePDF, loading = false }: LazyPDFProps) {
  return (
    <Button
      onClick={onGeneratePDF}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Generate PDF
        </>
      )}
    </Button>
  )
}
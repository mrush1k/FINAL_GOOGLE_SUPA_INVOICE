import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, User, InvoiceStatus } from './types'
import { formatCurrency } from './utils'

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 102, 204] // Default blue
}

// Helper function to add logo if available
const addLogoToPDF = (doc: jsPDF, logoUrl?: string) => {
  // For now, we'll add a placeholder where the logo would go
  // In a full implementation, you'd load the image and add it
  if (logoUrl) {
    // Logo would be loaded and placed here
    // doc.addImage(logoData, 'PNG', 20, 15, 40, 20)
    // For now, add a placeholder box
    doc.setDrawColor(200, 200, 200)
    doc.rect(20, 15, 40, 20)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('LOGO', 40, 27, { align: 'center' })
    doc.setTextColor(0, 0, 0) // Reset text color
  }
}

export const generateInvoicePDF = (invoice: Invoice, userProfile: User) => {
  const doc = new jsPDF()
  
  // Get user's theme color based on invoice color scheme preference
  const getInvoiceColor = (colorScheme: string) => {
    switch (colorScheme) {
      case 'green': return '#16a34a'
      case 'purple': return '#9333ea'
      case 'red': return '#dc2626'
      case 'blue':
      default: return '#0066CC'
    }
  }
  
  const invoiceColor = getInvoiceColor(userProfile.invoiceColorScheme || 'blue')
  const primaryColor = userProfile.primaryColor || invoiceColor
  const [r, g, b] = hexToRgb(primaryColor)
  
  // Add logo if available (top left)
  const logoUrl = userProfile.logoUrl || userProfile.aiLogoUrl
  addLogoToPDF(doc, logoUrl)
  
  // Company/Business name (top left, below logo area)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const businessName = userProfile.businessName || userProfile.username || 'Your Business'
  doc.text(businessName, 20, 45)
  
  // Invoice title (top right)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 190, 25, { align: 'right' })
  
  // Bill To section (left column)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(r, g, b)
  doc.setTextColor(255, 255, 255)
  doc.rect(20, 60, 30, 8, 'F')
  doc.text('BILL TO:', 22, 66)
  
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  let billToY = 80
  doc.text(invoice.customer?.displayName || 'Customer', 20, billToY)
  billToY += 8
  
  if (invoice.customer?.businessName) {
    doc.text(invoice.customer.businessName, 20, billToY)
    billToY += 8
  }
  
  if (invoice.customer?.email) {
    doc.text(invoice.customer.email, 20, billToY)
    billToY += 8
  }
  
  if (invoice.customer?.address) {
    doc.text(invoice.customer.address, 20, billToY)
    billToY += 8
  }
  
  if (invoice.customer?.city && invoice.customer?.state) {
    doc.text(`${invoice.customer.city}, ${invoice.customer.state}`, 20, billToY)
    billToY += 8
  }
  
  // Display ABN for Australian customers
  if (invoice.customer?.country === 'AU' && (invoice.customer?.abn || invoice.customer?.businessRegNumber)) {
    const abn = invoice.customer.abn || invoice.customer.businessRegNumber
    doc.text(`ABN: ${abn}`, 20, billToY)
    billToY += 8
  }
  
  // Invoice details (right column)
  const rightColX = 120
  doc.setFont('helvetica', 'bold')
  doc.text('NUMBER:', rightColX, 70)
  doc.text('DATE:', rightColX, 80)
  doc.text('DUE DATE:', rightColX, 90)
  
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.number, rightColX + 35, 70)
  doc.text(new Date(invoice.issueDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }), rightColX + 35, 80)
  doc.text(new Date(invoice.dueDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }), rightColX + 35, 90)
  
  // Items table
  const tableStartY = 125
  
  // Prepare table data
  const tableData = invoice.items?.map(item => {
    const description = item.name ? `${item.name}\n${item.description}` : item.description
    return [
      description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice, invoice.currency),
      getTaxLabel(userProfile.country) === 'GST' ? '10.0 %' : '0.0 %',
      formatCurrency(item.total, invoice.currency)
    ]
  }) || []
  
  autoTable(doc, {
    head: [['Description', 'Quantity', 'Unit price', getTaxLabel(userProfile.country) || 'Tax', 'Amount']],
    body: tableData,
    startY: tableStartY,
    theme: 'plain',
    headStyles: {
      fillColor: [r, g, b],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  })
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 40
  
  // Summary section (right-aligned)
  const summaryStartY = finalY + 20
  const summaryX = 120
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  // Subtotal
  doc.text('SUBTOTAL:', summaryX, summaryStartY)
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), 190, summaryStartY, { align: 'right' })
  
  // Tax
  const taxLabel = getTaxLabel(userProfile.country) || 'Tax'
  const taxMethod = invoice.taxInclusive ? 'Inclusive' : 'Exclusive'
  doc.text(`${taxLabel} (${taxMethod}):`, summaryX, summaryStartY + 10)
  doc.text(formatCurrency(invoice.taxAmount, invoice.currency), 190, summaryStartY + 10, { align: 'right' })
  
  // Total
  doc.text('TOTAL:', summaryX, summaryStartY + 20)
  doc.text(formatCurrency(invoice.total, invoice.currency), 190, summaryStartY + 20, { align: 'right' })
  
  // Amount paid (if any payments exist)
  const totalPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  if (totalPaid > 0) {
    doc.text('PAID:', summaryX, summaryStartY + 30)
    doc.text(formatCurrency(totalPaid, invoice.currency), 190, summaryStartY + 30, { align: 'right' })
  }
  
  // Balance Due (styled like the reference)
  const amountDue = invoice.total - totalPaid
  if (amountDue > 0) {
    const balanceY = summaryStartY + (totalPaid > 0 ? 45 : 35)
    doc.setFillColor(r, g, b)
    doc.rect(summaryX - 5, balanceY - 8, 75, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('BALANCE DUE', summaryX, balanceY)
    doc.text(formatCurrency(amountDue, invoice.currency), 185, balanceY, { align: 'right' })
    doc.setTextColor(0, 0, 0) // Reset text color
  }
  
  // Terms and Payment Instructions section at the bottom
  let termsY = Math.max(summaryStartY + 80, 240)
  
  // Payment Instructions (if present)
  if (invoice.paymentInstructions) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Payment Instructions', 20, termsY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const splitInstructions = doc.splitTextToSize(invoice.paymentInstructions, 170)
    doc.text(splitInstructions, 20, termsY + 8)
    termsY += 8 + (splitInstructions.length * 4) + 8
  }
  
  // Terms section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Terms', 20, termsY)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  
  // Default terms or custom notes
  const terms = invoice.notes || getDefaultTerms(userProfile)
  const splitTerms = doc.splitTextToSize(terms, 170)
  doc.text(splitTerms, 20, termsY + 8)
  
  // Add VOID watermark if invoice is voided
  if (invoice.status === InvoiceStatus.VOIDED) {
    addVoidWatermark(doc)
  }
  
  return doc
}

// Helper function to add VOID watermark
const addVoidWatermark = (doc: jsPDF) => {
  // Set watermark properties
  doc.setFontSize(60)
  doc.setTextColor(220, 53, 69) // Red color (Bootstrap danger color)
  doc.setFont('helvetica', 'bold')
  
  // Add rotated VOID text in center of page
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  // Rotate and center the text with reduced opacity effect
  doc.text('VOID', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45
  })
  
  // Reset to normal text properties
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
}

// Helper function to get tax label based on country
const getTaxLabel = (country?: string) => {
  switch (country) {
    case 'Australia':
    case 'New Zealand':
      return 'GST'
    case 'United Kingdom':
      return 'VAT'
    case 'Canada':
      return 'HST'
    default:
      return 'Tax'
  }
}

// Helper function to get default terms
const getDefaultTerms = (userProfile: User) => {
  const businessName = userProfile.businessName || userProfile.username
  return `Invoice Note:\n\nName: ${businessName}\nBSB: 063 595\nAcc #: 1094 6550\nABN: ${userProfile.businessRegNumber || '11639815624'}\n\n(Please note all the digital assets created/produced through ${businessName} are the intellectual property of ${businessName} and can not be replicated unless specified or prior permission.)`
}

export const generateReceiptPDF = (invoice: Invoice, userProfile: User, payment: { amount: number; paymentDate: string; method: string }) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' })
  
  // Company details
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(userProfile.username || 'Your Business Name', 20, 40)
  doc.text(userProfile.email, 20, 48)
  
  // Receipt details
  doc.setFont('helvetica', 'bold')
  doc.text('Receipt for Invoice #:', 20, 70)
  doc.text('Payment Date:', 20, 78)
  doc.text('Payment Method:', 20, 86)
  doc.text('Amount Paid:', 20, 94)
  
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.number, 80, 70)
  doc.text(new Date(payment.paymentDate).toLocaleDateString(), 80, 78)
  doc.text(payment.method, 80, 86)
  doc.text(formatCurrency(payment.amount, invoice.currency), 80, 94)
  
  // Customer info
  doc.setFont('helvetica', 'bold')
  doc.text('Paid by:', 20, 110)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.customer?.displayName || 'Customer', 20, 118)
  
  // Payment summary
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Summary:', 20, 140)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice Total: ${formatCurrency(invoice.total, invoice.currency)}`, 20, 150)
  
  // Calculate total paid and remaining
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
  const amountDue = invoice.total - totalPaid
  
  doc.text(`Total Paid: ${formatCurrency(totalPaid, invoice.currency)}`, 20, 158)
  if (amountDue > 0) {
    doc.text(`Amount Due: ${formatCurrency(amountDue, invoice.currency)}`, 20, 166)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.text('Status: PAID IN FULL', 20, 166)
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Thank you for your payment!', 105, pageHeight - 20, { align: 'center' })
  
  return doc
}


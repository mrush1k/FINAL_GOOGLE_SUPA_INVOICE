export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  country: string
  currency: string
  defaultTaxRate?: number
  workType?: string
  customWorkType?: string
  firstName?: string
  lastName?: string
  businessName?: string
  businessNumber?: string
  businessRegNumber?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  zipCode?: string
  website?: string
  dateFormat?: string
  taxLabel?: string
  businessIdLabel?: string
  locale?: string
  onboardingCompleted?: boolean
  logoUrl?: string
  aiLogoUrl?: string
  aiLogoPrompt?: string
  aiLogoGeneratedAt?: Date
  primaryColor?: string
  colorScheme?: string
  // New invoice appearance settings
  invoiceTemplate?: string
  invoiceColorScheme?: string
  alwaysCcSelf?: boolean
  defaultPaymentInstructions?: string
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  userId: string
  displayName: string
  firstName?: string
  lastName?: string
  businessName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  businessRegNumber?: string
  abn?: string
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  userId: string
  customerId: string
  number: string
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  currency: string
  subtotal: number
  taxAmount: number
  taxInclusive: boolean
  total: number
  poNumber?: string
  notes?: string
  terms?: string
  paymentInstructions?: string
  ccEmails?: string
  // Email tracking fields
  sentAt?: Date
  sentTo?: string
  emailCount?: number
  lastEmailSentAt?: Date
  emailDelivered?: boolean
  emailOpened?: boolean
  emailOpenedAt?: Date
  emailClicked?: boolean
  emailClickedAt?: Date
  emailBounced?: boolean
  emailBouncedAt?: Date
  deliveryStatus?: string
  trackingId?: string
  // Void and delete audit fields
  voidedAt?: Date
  voidedBy?: string
  voidReason?: string
  deletedAt?: Date
  deletedBy?: string
  deleteReason?: string
  createdAt: Date
  updatedAt: Date
  customer?: Customer
  items?: InvoiceItem[]
  payments?: Payment[]
  auditLogs?: InvoiceAuditLog[]
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentDate: Date
  paymentMethod: PaymentMethod
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  READ = 'READ',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHECK = 'CHECK',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  OTHER = 'OTHER'
}

export interface Estimate {
  id: string
  userId: string
  customerId: string
  number: string
  status: EstimateStatus
  issueDate: Date
  validUntil: Date
  currency: string
  subtotal: number
  taxAmount: number
  taxInclusive: boolean
  total: number
  notes?: string
  terms?: string
  convertedToInvoiceId?: string
  convertedAt?: Date
  createdAt: Date
  updatedAt: Date
  customer?: Customer
  items?: EstimateItem[]
}

export interface EstimateItem {
  id: string
  estimateId: string
  itemName?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  createdAt: Date
  updatedAt: Date
}

export enum EstimateStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED'
}

export interface CountryConfig {
  code: string
  name: string
  currency: string
  businessRegLabel: string
  businessRegPattern?: string
  taxLabel?: string
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    businessRegLabel: 'ABN (11 digits)',
    businessRegPattern: '^\\d{11}$',
    taxLabel: 'GST'
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    currency: 'NZD',
    businessRegLabel: 'NZBN',
    taxLabel: 'GST'
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    businessRegLabel: 'EIN',
    taxLabel: 'Tax'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    businessRegLabel: 'Company Reg. No.',
    taxLabel: 'VAT'
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    businessRegLabel: 'BN (with RT suffix)',
    taxLabel: 'HST/GST'
  }
]

export interface CreateInvoiceData {
  customerId: string
  number: string
  issueDate: Date
  dueDate: Date
  currency: string
  poNumber?: string
  notes?: string
  terms?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
  }[]
}

export interface CreateCustomerData {
  displayName: string
  firstName?: string
  lastName?: string
  businessName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  businessRegNumber?: string
}

export interface CreatePaymentData {
  invoiceId: string
  amount: number
  paymentDate: Date
  paymentMethod: PaymentMethod
  notes?: string
}

export interface CreateEstimateData {
  customerId: string
  number: string
  issueDate: Date
  validUntil: Date
  currency: string
  notes?: string
  terms?: string
  items: {
    itemName?: string
    description: string
    quantity: number
    unitPrice: number
  }[]
}

export interface InvoiceAuditLog {
  id: string
  invoiceId: string
  userId: string
  action: string
  reason?: string
  oldStatus?: string
  newStatus?: string
  timestamp: Date
}

export interface VoidInvoiceData {
  reason?: string
}

export interface DeleteInvoiceData {
  reason?: string
}
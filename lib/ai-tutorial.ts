import { User } from './types'

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetElement?: string
  content: string
  actionButton?: {
    text: string
    action: string
  }
}

export interface Tutorial {
  id: string
  businessType: string
  title: string
  description: string
  steps: TutorialStep[]
  estimatedTime: number
}

export interface UserTutorial {
  id: string
  userId: string
  tutorialId: string
  completed: boolean
  currentStep: number
  completedAt?: Date
  createdAt: Date
}

// Business type mapping from signup form
export const BUSINESS_TYPE_TUTORIALS: Record<string, Tutorial> = {
  'trades-construction': {
    id: 'trades-construction-tutorial',
    businessType: 'trades-construction',
    title: 'Invoice Easy for Trades & Construction',
    description: 'Learn how to manage invoices, customers, and payments for your construction business.',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Invoice Easy!',
        description: 'Perfect for builders, electricians, plumbers, and other trade professionals.',
        content: 'Invoice Easy is designed specifically for trade professionals like you. We\'ll show you how to create professional invoices, track payments, and manage your customers efficiently.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'add-customer',
        title: 'Adding Your First Customer',
        description: 'Learn how to add customer details and job site information.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Click "Customers" in the sidebar to add your first customer. You can store contact information, billing addresses, and job site details for easy access when creating invoices.',
        actionButton: {
          text: 'Add a Customer',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'create-invoice',
        title: 'Creating Professional Invoices',
        description: 'Create invoices for materials, labor, and services.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Create professional invoices that include:\n• Labor hours and rates\n• Materials and supplies\n• Equipment rental\n• Travel/service charges\n\nYour invoices will automatically include your business registration number and contact details.',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'track-payments',
        title: 'Tracking Payments',
        description: 'Monitor which jobs have been paid and which are overdue.',
        content: 'The dashboard shows you:\n• Outstanding invoices (red section)\n• Paid invoices (green section)\n• Total amounts owed\n\nYou can mark invoices as paid when customers pay via cash, check, or bank transfer.',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'email-invoices',
        title: 'Sending Invoices via Email',
        description: 'Send professional PDF invoices directly to customers.',
        content: 'Click "Send Invoice" to email a professional PDF invoice to your customer. You\'ll get delivery confirmations and can track if they\'ve opened the email.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  },
  'creative-digital': {
    id: 'creative-digital-tutorial',
    businessType: 'creative-digital',
    title: 'Invoice Easy for Creative & Digital Professionals',
    description: 'Streamline invoicing for your design, development, or creative projects.',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome Creative Professional!',
        description: 'Perfect for designers, developers, photographers, and writers.',
        content: 'Invoice Easy helps creative professionals manage client projects and payments. We\'ll show you how to create invoices for hourly work, project milestones, and creative services.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'add-client',
        title: 'Adding Clients',
        description: 'Store client information and project details.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Add your clients with their company details, contact information, and project preferences. This makes it easy to create invoices for ongoing projects.',
        actionButton: {
          text: 'Add a Client',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'project-invoices',
        title: 'Creating Project Invoices',
        description: 'Invoice for hourly work, fixed projects, or milestones.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Create invoices for:\n• Hourly design/development work\n• Fixed-price projects\n• Milestone payments\n• Revisions and additional work\n• License fees or usage rights',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'project-tracking',
        title: 'Tracking Project Payments',
        description: 'Monitor which projects have been paid and follow up on overdue payments.',
        content: 'Keep track of all your projects in one place. The dashboard shows overdue invoices in red and completed payments in green, so you always know your cash flow status.',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'professional-delivery',
        title: 'Professional Invoice Delivery',
        description: 'Send polished PDF invoices that reflect your brand.',
        content: 'Your invoices are automatically formatted with your business details and sent as professional PDFs. You\'ll get email tracking to see when clients receive and open your invoices.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  },
  'freelance-consulting': {
    id: 'freelance-consulting-tutorial',
    businessType: 'freelance-consulting',
    title: 'Invoice Easy for Freelancers & Consultants',
    description: 'Professional invoicing for consultants, advisors, and solo operators.',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome Freelancer!',
        description: 'Professional invoicing for consultants and solo operators.',
        content: 'As a freelancer or consultant, professional invoicing is crucial for your business reputation. We\'ll show you how to create invoices that get paid faster.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'client-management',
        title: 'Managing Clients',
        description: 'Store client details and project information.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Add your clients with their contact details, preferred payment terms, and project information. You can also store notes about each client for future reference.',
        actionButton: {
          text: 'Add a Client',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'consulting-invoices',
        title: 'Creating Consulting Invoices',
        description: 'Professional invoices for your services.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Create professional invoices for:\n• Hourly consulting rates\n• Fixed-price projects\n• Retainer agreements\n• Workshop facilitation\n• Strategic advice and planning',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'payment-tracking',
        title: 'Payment Tracking & Follow-up',
        description: 'Stay on top of your cash flow.',
        content: 'Monitor your income with the dashboard overview. Red sections show overdue invoices that need follow-up, while green sections show completed payments.',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'professional-communication',
        title: 'Professional Client Communication',
        description: 'Send branded invoices that build trust.',
        content: 'Your invoices automatically include your business registration details and are delivered as professional PDF attachments. This builds trust with clients and speeds up payment.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  },
  'landscaping-outdoor': {
    id: 'landscaping-outdoor-tutorial',
    businessType: 'landscaping-outdoor',
    title: 'Invoice Easy for Landscaping & Outdoor Work',
    description: 'Invoice management for gardeners, landscapers, and outdoor professionals.',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome Landscaping Professional!',
        description: 'Perfect for gardeners, landscapers, and outdoor work specialists.',
        content: 'Invoice Easy helps landscaping professionals manage seasonal work, ongoing maintenance contracts, and project-based invoicing.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'property-clients',
        title: 'Adding Property Clients',
        description: 'Store client and property details.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Add clients with their property addresses and service details. You can store multiple properties per client for maintenance routes and seasonal work.',
        actionButton: {
          text: 'Add a Client',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'landscape-invoices',
        title: 'Creating Landscape Invoices',
        description: 'Invoice for materials, plants, labor, and equipment.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Create invoices for:\n• Plant materials and supplies\n• Labor hours and crew work\n• Equipment rental and operation\n• Ongoing maintenance contracts\n• Seasonal cleanup services',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'seasonal-tracking',
        title: 'Seasonal Work Tracking',
        description: 'Monitor payments for seasonal and ongoing work.',
        content: 'Track your seasonal work and maintenance contracts. The dashboard shows which properties have outstanding invoices and which clients are up to date with payments.',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'client-communication',
        title: 'Professional Client Communication',
        description: 'Send detailed invoices for transparent billing.',
        content: 'Send professional PDF invoices that detail all work performed, materials used, and time spent. This transparency builds trust with property owners.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  },
  'retail-sales': {
    id: 'retail-sales-tutorial',
    businessType: 'retail-sales',
    title: 'Invoice Easy for Retail & Sales Services',
    description: 'Invoice management for retail, sales, and service professionals.',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome Sales Professional!',
        description: 'Perfect for retail, sales, and personal service providers.',
        content: 'Whether you provide personal services, retail sales, or delivery services, Invoice Easy helps you get paid promptly and professionally.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'customer-database',
        title: 'Building Your Customer Database',
        description: 'Store customer details and preferences.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Build a database of your customers with their contact details, service preferences, and billing information for repeat business.',
        actionButton: {
          text: 'Add a Customer',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'service-invoices',
        title: 'Creating Service Invoices',
        description: 'Invoice for products, services, and deliveries.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Create invoices for:\n• Product sales and retail items\n• Service fees and consultations\n• Delivery and shipping charges\n• Installation or setup services\n• Ongoing service agreements',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'sales-tracking',
        title: 'Tracking Sales & Services',
        description: 'Monitor your revenue and outstanding payments.',
        content: 'Keep track of all your sales and services in one place. See which customers have outstanding invoices and monitor your monthly revenue.',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'customer-experience',
        title: 'Professional Customer Experience',
        description: 'Build trust with professional invoicing.',
        content: 'Professional PDF invoices with your business details create a great customer experience and encourage repeat business and referrals.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  },
  'solo-small-business': {
    id: 'solo-small-business-tutorial',
    businessType: 'solo-small-business',
    title: 'Invoice Easy for Solo Operators & Small Business',
    description: 'Complete invoicing solution for small business owners.',
    estimatedTime: 6,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome Small Business Owner!',
        description: 'Complete invoicing solution for solo operators and small businesses.',
        content: 'Running a small business means wearing many hats. We\'ll show you how Invoice Easy simplifies your invoicing so you can focus on growing your business.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'business-setup',
        title: 'Setting Up Your Business Profile',
        description: 'Complete your business information for professional invoices.',
        targetElement: 'nav[href="/dashboard/settings"]',
        content: 'Complete your business profile in Settings to ensure your invoices look professional and include all required business registration details.',
        actionButton: {
          text: 'Check Settings',
          action: 'navigate:/dashboard/settings'
        }
      },
      {
        id: 'customer-base',
        title: 'Building Your Customer Base',
        description: 'Add customers and organize your client relationships.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Add all your customers with their contact details, billing preferences, and notes. This becomes your customer relationship database.',
        actionButton: {
          text: 'Manage Customers',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'comprehensive-invoicing',
        title: 'Comprehensive Invoicing',
        description: 'Create invoices for all your business services.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Create invoices for any type of business:\n• Products and services\n• Hourly and project work\n• Recurring billing\n• Multiple line items\n• Tax calculations',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'business-analytics',
        title: 'Business Analytics & Tracking',
        description: 'Monitor your business performance.',
        content: 'Use the dashboard to track:\n• Total revenue and outstanding payments\n• Customer payment patterns\n• Monthly and yearly trends\n• Business growth metrics',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'growth-tools',
        title: 'Tools for Business Growth',
        description: 'Professional systems that scale with your business.',
        content: 'Invoice Easy grows with your business. Professional invoicing, automated reminders, and detailed tracking help you maintain cash flow as you expand.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  },
  'other': {
    id: 'other-tutorial',
    businessType: 'other',
    title: 'Invoice Easy for Your Business',
    description: 'Complete invoicing solution customized for your unique business needs.',
    estimatedTime: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Invoice Easy!',
        description: 'Professional invoicing for any type of business.',
        content: 'No matter what type of business you run, Invoice Easy provides professional invoicing tools to help you get paid faster and manage your finances better.',
        actionButton: {
          text: 'Get Started',
          action: 'next'
        }
      },
      {
        id: 'customer-setup',
        title: 'Adding Your Customers',
        description: 'Store all your customer information in one place.',
        targetElement: 'nav[href="/dashboard/customers"]',
        content: 'Add your customers with their contact details, billing information, and any special requirements for your business type.',
        actionButton: {
          text: 'Add Customers',
          action: 'navigate:/dashboard/customers'
        }
      },
      {
        id: 'flexible-invoicing',
        title: 'Flexible Invoice Creation',
        description: 'Create invoices that match your business needs.',
        targetElement: 'button:contains("New Invoice")',
        content: 'Invoice Easy adapts to any business:\n• Flexible line items and descriptions\n• Custom pricing and quantities\n• Multiple tax rates if needed\n• Professional formatting',
        actionButton: {
          text: 'Create Invoice',
          action: 'navigate:/dashboard/invoices/new'
        }
      },
      {
        id: 'payment-management',
        title: 'Payment Management',
        description: 'Track payments and manage cash flow.',
        content: 'Keep track of all your invoices and payments. The dashboard shows your financial overview and helps you identify which customers need follow-up.',
        actionButton: {
          text: 'View Dashboard',
          action: 'navigate:/dashboard'
        }
      },
      {
        id: 'professional-presence',
        title: 'Professional Business Presence',
        description: 'Build credibility with professional invoicing.',
        content: 'Professional PDF invoices with your business registration details build credibility and trust with your customers, leading to faster payments and repeat business.',
        actionButton: {
          text: 'Finish Tutorial',
          action: 'complete'
        }
      }
    ]
  }
}

// Generate tutorial based on user's work type
export function generateTutorialForUser(user: User): Tutorial | null {
  if (!user.workType) return null
  
  // Map work type to tutorial
  const tutorialKey = user.workType.toLowerCase().replace(/\s+/g, '-')
  let tutorial = BUSINESS_TYPE_TUTORIALS[tutorialKey]
  
  // Fallback to 'other' if no specific tutorial found
  if (!tutorial) {
    tutorial = BUSINESS_TYPE_TUTORIALS['other']
  }
  
  return tutorial
}

// Save user tutorial progress
export async function saveUserTutorial(tutorialId: string, currentStep: number, completed: boolean): Promise<UserTutorial> {
  const response = await fetch('/api/tutorials/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No Authorization header needed with Supabase cookie auth
    },
    body: JSON.stringify({
      tutorialId,
      currentStep,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to save tutorial progress')
  }
  
  return response.json()
}

// Get user tutorial progress
export async function getUserTutorial(tutorialId: string): Promise<UserTutorial | null> {
  try {
    const response = await fetch(`/api/tutorials/progress?tutorialId=${tutorialId}`)
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch tutorial progress')
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching tutorial progress:', error)
    return null
  }
}

// Update tutorial progress
export async function updateTutorialProgress(
  tutorialId: string, 
  currentStep: number, 
  completed: boolean = false
): Promise<UserTutorial> {
  const response = await fetch('/api/tutorials/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No Authorization header needed with Supabase cookie auth
    },
    body: JSON.stringify({
      tutorialId,
      currentStep,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to update tutorial progress')
  }
  
  return response.json()
}
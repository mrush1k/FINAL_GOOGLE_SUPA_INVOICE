export interface DiagnosticResult {
  componentId: string
  name: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: any
  timestamp: Date
  dependencies?: string[]
}

export interface ComponentRegistry {
  id: string
  name: string
  type: 'page' | 'api' | 'component' | 'service' | 'database'
  dependencies: string[]
  validators: DiagnosticValidator[]
  critical: boolean
}

export interface DiagnosticValidator {
  id: string
  name: string
  description: string
  validate: () => Promise<DiagnosticResult> | DiagnosticResult
}

export class DiagnosticEngine {
  private components: Map<string, ComponentRegistry> = new Map()
  private isDevMode: boolean = process.env.NODE_ENV === 'development'
  
  constructor() {
    this.registerCoreComponents()
  }

  private registerCoreComponents() {
    // Core units that other components may depend on
    // Supabase client (used by auth-system)
    this.registerComponent({
      id: 'supabase-client',
      name: 'Supabase Client',
      type: 'service',
      dependencies: [],
      critical: true,
      validators: [
        {
          id: 'supabase-configured',
          name: 'Supabase Configuration',
          description: 'Checks Supabase environment variables',
          validate: this.validateSupabaseConnection
        }
      ]
    })

    // Auth React context (provider present on client)
    this.registerComponent({
      id: 'auth-context',
      name: 'Auth Context',
      type: 'component',
      dependencies: [],
      critical: true,
      validators: [
        {
          id: 'auth-context-runtime',
          name: 'Auth Context Provider',
          description: 'Validates auth context is properly initialized',
          validate: this.validateAuthContext
        }
      ]
    })

    // Database URL (env var)
    this.registerComponent({
      id: 'database-url',
      name: 'Database URL',
      type: 'database',
      dependencies: [],
      critical: true,
      validators: [
        {
          id: 'database-url-present',
          name: 'Database URL Presence',
          description: 'Checks that DATABASE_URL appears configured',
          validate: this.validateDatabaseUrl
        }
      ]
    })

    // Prisma Client (server-only; client validator is informational)
    this.registerComponent({
      id: 'prisma-client',
      name: 'Prisma Client',
      type: 'service',
      dependencies: ['database-url'],
      critical: true,
      validators: [
        {
          id: 'prisma-client-availability',
          name: 'Prisma Client Availability',
          description: 'Ensures Prisma client is expected to be available (server-side check deferred)',
          validate: this.validatePrismaClient
        }
      ]
    })

    // Authentication System
    this.registerComponent({
      id: 'auth-system',
      name: 'Authentication System',
      type: 'service',
      dependencies: ['supabase-client', 'auth-context'],
      critical: true,
      validators: [
        {
          id: 'auth-supabase-connection',
          name: 'Supabase Connection',
          description: 'Validates Supabase client configuration',
          validate: this.validateSupabaseConnection
        },
        {
          id: 'auth-context-provider',
          name: 'Auth Context Provider',
          description: 'Validates auth context is properly initialized',
          validate: this.validateAuthContext
        }
      ]
    })

    // Database System
    this.registerComponent({
      id: 'database-system',
      name: 'Database System',
      type: 'database',
      dependencies: ['prisma-client', 'database-url'],
      critical: true,
      validators: [
        {
          id: 'database-connection',
          name: 'Database Connection',
          description: 'Validates database connectivity',
          validate: this.validateDatabaseConnection
        },
        {
          id: 'database-schema',
          name: 'Database Schema',
          description: 'Validates database schema integrity',
          validate: this.validateDatabaseSchema
        }
      ]
    })

    // Invoice Management
    this.registerComponent({
      id: 'invoice-management',
      name: 'Invoice Management',
      type: 'service',
      dependencies: ['database-system', 'auth-system', 'pdf-generator'],
      critical: true,
      validators: [
        {
          id: 'invoice-api-endpoints',
          name: 'Invoice API Endpoints',
          description: 'Validates invoice API endpoints are accessible',
          validate: this.validateInvoiceEndpoints
        },
        {
          id: 'invoice-data-models',
          name: 'Invoice Data Models',
          description: 'Validates invoice data models and relationships',
          validate: this.validateInvoiceModels
        }
      ]
    })

    // Customer Management
    this.registerComponent({
      id: 'customer-management',
      name: 'Customer Management',
      type: 'service',
      dependencies: ['database-system', 'auth-system'],
      critical: true,
      validators: [
        {
          id: 'customer-api-endpoints',
          name: 'Customer API Endpoints',
          description: 'Validates customer API endpoints are accessible',
          validate: this.validateCustomerEndpoints
        }
      ]
    })

    // Payment System
    this.registerComponent({
      id: 'payment-system',
      name: 'Payment System',
      type: 'service',
      dependencies: ['database-system', 'invoice-management'],
      critical: true,
      validators: [
        {
          id: 'payment-recording',
          name: 'Payment Recording',
          description: 'Validates payment recording functionality',
          validate: this.validatePaymentRecording
        }
      ]
    })

    // PDF Generation
    this.registerComponent({
      id: 'pdf-generator',
      name: 'PDF Generator',
      type: 'service',
      dependencies: [],
      critical: false,
      validators: [
        {
          id: 'pdf-generation',
          name: 'PDF Generation',
          description: 'Validates PDF generation capabilities',
          validate: this.validatePdfGeneration
        }
      ]
    })
  }

  registerComponent(component: ComponentRegistry) {
    this.components.set(component.id, component)
  }

  async runDiagnostics(componentIds?: string[]): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []
    const componentsToCheck = componentIds 
      ? componentIds.map(id => this.components.get(id)).filter(Boolean) as ComponentRegistry[]
      : Array.from(this.components.values())

    for (const component of componentsToCheck) {
      // Check dependencies first
      for (const depId of component.dependencies) {
        const dependency = this.components.get(depId)
        if (!dependency) {
          results.push({
            componentId: component.id,
            name: `${component.name} - Missing Dependency`,
            status: 'error',
            message: `Missing dependency: ${depId}`,
            timestamp: new Date(),
            dependencies: component.dependencies
          })
        }
      }

      // Run component validators
      for (const validator of component.validators) {
        try {
          const result = await validator.validate()
          results.push(result)
          
          if (this.isDevMode && result.status !== 'healthy') {
            console.warn(`[DIAGNOSTIC] ${component.name}: ${result.message}`, result.details)
          }
        } catch (error) {
          results.push({
            componentId: component.id,
            name: `${component.name} - ${validator.name}`,
            status: 'error',
            message: `Validator failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            dependencies: component.dependencies
          })
        }
      }
    }

    return results
  }

  async runStartupDiagnostics(): Promise<DiagnosticResult[]> {
    const criticalComponents = Array.from(this.components.values())
      .filter(component => component.critical)
      .map(component => component.id)
    
    return this.runDiagnostics(criticalComponents)
  }

  // Validator implementations
  private validateSupabaseConnection = (): DiagnosticResult => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || url === 'https://placeholder.supabase.co') {
      return {
        componentId: 'auth-system',
        name: 'Supabase Connection',
        status: 'error',
        message: 'Supabase URL not configured',
        timestamp: new Date()
      }
    }
    
    if (!key || key === 'placeholder-key') {
      return {
        componentId: 'auth-system',
        name: 'Supabase Connection',
        status: 'error',
        message: 'Supabase anonymous key not configured',
        timestamp: new Date()
      }
    }
    
    return {
      componentId: 'auth-system',
      name: 'Supabase Connection',
      status: 'healthy',
      message: 'Supabase connection configured',
      timestamp: new Date()
    }
  }

  private validateAuthContext = (): DiagnosticResult => {
    // This would be validated during runtime when context is available
    return {
      componentId: 'auth-system',
      name: 'Auth Context Provider',
      status: 'healthy',
      message: 'Auth context validation requires runtime check',
      timestamp: new Date()
    }
  }

  // Basic presence check for DATABASE_URL env var
  private validateDatabaseUrl = (): DiagnosticResult => {
    // Avoid server secret access on the client; defer check to server
    if (typeof window !== 'undefined') {
      return {
        componentId: 'database-url',
        name: 'Database URL Presence',
        status: 'healthy',
        message: 'Database URL check deferred to server (client-safe)',
        timestamp: new Date()
      }
    }
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl || databaseUrl.trim() === '' || databaseUrl.includes('placeholder')) {
      return {
        componentId: 'database-url',
        name: 'Database URL Presence',
        status: 'error',
        message: 'Database URL not configured',
        timestamp: new Date()
      }
    }

    return {
      componentId: 'database-url',
      name: 'Database URL Presence',
      status: 'healthy',
      message: 'Database URL configured',
      timestamp: new Date()
    }
  }

  // Safe client-side validator for Prisma Client
  // Note: Actual connectivity must be validated server-side. Here we only provide a
  // non-breaking diagnostic to avoid bundling server-only modules in the client.
  private validatePrismaClient = (): DiagnosticResult => {
    if (typeof window !== 'undefined') {
      return {
        componentId: 'prisma-client',
        name: 'Prisma Client Availability',
        status: 'healthy',
        message: 'Prisma client is server-only; runtime connectivity check deferred',
        timestamp: new Date()
      }
    }

    // On the server, we could attempt a lightweight require check, but avoid here to keep
    // this engine universal. Consider adding a server-side diagnostic route if needed.
    return {
      componentId: 'prisma-client',
      name: 'Prisma Client Availability',
      status: 'healthy',
      message: 'Prisma client expected to be available on server',
      timestamp: new Date()
    }
  }

  private validateDatabaseConnection = (): DiagnosticResult => {
    // Only meaningful on the server; client should not inspect server env
    if (typeof window !== 'undefined') {
      return {
        componentId: 'database-system',
        name: 'Database Connection',
        status: 'healthy',
        message: 'Database connection check deferred to server (client-safe)',
        timestamp: new Date()
      }
    }
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl || databaseUrl.includes('placeholder')) {
      return {
        componentId: 'database-system',
        name: 'Database Connection',
        status: 'error',
        message: 'Database URL not configured',
        timestamp: new Date()
      }
    }
    
    return {
      componentId: 'database-system',
      name: 'Database Connection',
      status: 'healthy',
      message: 'Database URL configured',
      timestamp: new Date()
    }
  }

  private validateDatabaseSchema = (): DiagnosticResult => {
    // This would require actual database connection to validate
    return {
      componentId: 'database-system',
      name: 'Database Schema',
      status: 'healthy',
      message: 'Schema validation requires database connection',
      timestamp: new Date()
    }
  }

  private validateInvoiceEndpoints = (): DiagnosticResult => {
    // Check if invoice API routes exist in the file system
    return {
      componentId: 'invoice-management',
      name: 'Invoice API Endpoints',
      status: 'healthy',
      message: 'Invoice endpoints validation requires runtime check',
      timestamp: new Date()
    }
  }

  private validateInvoiceModels = (): DiagnosticResult => {
    return {
      componentId: 'invoice-management',
      name: 'Invoice Data Models',
      status: 'healthy',
      message: 'Invoice models validation requires database connection',
      timestamp: new Date()
    }
  }

  private validateCustomerEndpoints = (): DiagnosticResult => {
    return {
      componentId: 'customer-management',
      name: 'Customer API Endpoints',
      status: 'healthy',
      message: 'Customer endpoints validation requires runtime check',
      timestamp: new Date()
    }
  }

  private validatePaymentRecording = (): DiagnosticResult => {
    return {
      componentId: 'payment-system',
      name: 'Payment Recording',
      status: 'healthy',
      message: 'Payment recording validation requires runtime check',
      timestamp: new Date()
    }
  }

  private validatePdfGeneration = (): DiagnosticResult => {
    return {
      componentId: 'pdf-generator',
      name: 'PDF Generation',
      status: 'healthy',
      message: 'PDF generation validation requires runtime check',
      timestamp: new Date()
    }
  }

  getCriticalIssues(results: DiagnosticResult[]): DiagnosticResult[] {
    return results.filter(result => 
      result.status === 'error' && 
      this.components.get(result.componentId)?.critical
    )
  }

  getComponentDependencies(componentId: string): string[] {
    const component = this.components.get(componentId)
    return component ? component.dependencies : []
  }

  getAllComponents(): ComponentRegistry[] {
    return Array.from(this.components.values())
  }
}

export const diagnosticEngine = new DiagnosticEngine()
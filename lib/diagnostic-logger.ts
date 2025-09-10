"use client"

import { DiagnosticResult } from './diagnostic-engine'

export interface DiagnosticLogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  component: string
  message: string
  details?: any
  userVisible: boolean
}

export class DiagnosticLogger {
  private logs: DiagnosticLogEntry[] = []
  private maxLogs: number = 1000
  private listeners: ((entry: DiagnosticLogEntry) => void)[] = []
  private userWarnings: Set<string> = new Set()
  private originalConsole: any

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientLogger()
    }
  }

  private initializeClientLogger() {
    // Override console methods to capture diagnostic logs
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    }

    console.log = (...args) => {
      this.logDiagnostic('info', 'console', args.join(' '), false)
      this.originalConsole.log(...args)
    }

    console.warn = (...args) => {
      this.logDiagnostic('warning', 'console', args.join(' '), false)
      this.originalConsole.warn(...args)
    }

    console.error = (...args) => {
      this.logDiagnostic('error', 'console', args.join(' '), false)
      this.originalConsole.error(...args)
    }
  }

  logDiagnostic(
    level: 'info' | 'warning' | 'error',
    component: string,
    message: string,
    userVisible: boolean = false,
    details?: any
  ) {
    const entry: DiagnosticLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      component,
      message,
      details,
      userVisible
    }

    this.logs.push(entry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(entry))

    // Show user-facing warnings
    if (userVisible && level === 'warning' && typeof window !== 'undefined') {
      this.showUserWarning(message, component)
    }

    // Log to console for development using original console methods to avoid recursion
    if (process.env.NODE_ENV === 'development' && this.originalConsole) {
      const prefix = `[DIAGNOSTIC-${level.toUpperCase()}]`
      switch (level) {
        case 'info':
          this.originalConsole.log(`${prefix} ${component}: ${message}`, details)
          break
        case 'warning':
          this.originalConsole.warn(`${prefix} ${component}: ${message}`, details)
          break
        case 'error':
          this.originalConsole.error(`${prefix} ${component}: ${message}`, details)
          break
      }
    }
  }

  logDiagnosticResults(results: DiagnosticResult[]) {
    results.forEach(result => {
      const level = result.status === 'healthy' ? 'info' : 
                   result.status === 'warning' ? 'warning' : 'error'
      
      this.logDiagnostic(
        level,
        result.componentId,
        result.message,
        result.status === 'error', // Show errors to users
        {
          name: result.name,
          dependencies: result.dependencies,
          details: result.details
        }
      )
    })
  }

  private showUserWarning(message: string, component: string) {
    // Avoid showing duplicate warnings
    const warningKey = `${component}-${message}`
    if (this.userWarnings.has(warningKey)) {
      return
    }
    this.userWarnings.add(warningKey)

    // Create non-intrusive notification
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-lg z-50
      max-w-sm text-sm
    `.trim()
    
    notification.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-yellow-800 font-medium">System Notice</p>
          <p class="text-yellow-700">${message}</p>
          <p class="text-yellow-600 text-xs mt-1">Component: ${component}</p>
        </div>
        <div class="ml-auto pl-3">
          <button class="text-yellow-400 hover:text-yellow-600" onclick="this.parentElement.parentElement.parentElement.remove()">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    `

    document.body.appendChild(notification)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      this.userWarnings.delete(warningKey)
    }, 10000)
  }

  // API for components to report issues
  reportComponentIssue(
    component: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'warning',
    details?: any,
    showToUser: boolean = false
  ) {
    this.logDiagnostic(severity, component, message, showToUser, details)
  }

  // API for form validation errors
  reportFormValidationError(
    formId: string,
    fieldName: string,
    errorMessage: string,
    showToUser: boolean = true
  ) {
    this.logDiagnostic(
      'error',
      `form-${formId}`,
      `Validation error in field '${fieldName}': ${errorMessage}`,
      showToUser,
      { fieldName, formId }
    )
  }

  // API for API call failures
  reportApiError(
    endpoint: string,
    method: string,
    errorMessage: string,
    statusCode?: number,
    details?: any
  ) {
    this.logDiagnostic(
      'error',
      'api-client',
      `API ${method} ${endpoint} failed: ${errorMessage}`,
      true, // Show API errors to users
      { endpoint, method, statusCode, details }
    )
  }

  // API for dependency loading issues
  reportDependencyError(
    dependencyName: string,
    errorMessage: string,
    critical: boolean = false
  ) {
    this.logDiagnostic(
      critical ? 'error' : 'warning',
      'dependency-loader',
      `Dependency '${dependencyName}' issue: ${errorMessage}`,
      critical,
      { dependencyName, critical }
    )
  }

  // Get logs for debugging
  getLogs(component?: string, level?: 'info' | 'warning' | 'error'): DiagnosticLogEntry[] {
    let filteredLogs = this.logs

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component)
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get recent critical issues
  getCriticalIssues(lastMinutes: number = 60): DiagnosticLogEntry[] {
    const cutoff = new Date(Date.now() - lastMinutes * 60 * 1000)
    return this.logs.filter(log => 
      log.level === 'error' && 
      log.timestamp >= cutoff
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Subscribe to log events
  subscribe(listener: (entry: DiagnosticLogEntry) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Clear logs
  clearLogs() {
    this.logs = []
    this.userWarnings.clear()
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Global diagnostic logger instance
export const diagnosticLogger = new DiagnosticLogger()

// Helper functions for common logging scenarios
export const logInfo = (component: string, message: string, details?: any) => {
  diagnosticLogger.logDiagnostic('info', component, message, false, details)
}

export const logWarning = (component: string, message: string, showToUser: boolean = false, details?: any) => {
  diagnosticLogger.logDiagnostic('warning', component, message, showToUser, details)
}

export const logError = (component: string, message: string, showToUser: boolean = true, details?: any) => {
  diagnosticLogger.logDiagnostic('error', component, message, showToUser, details)
}

// Note: useDiagnosticLogs hook is moved to diagnostic-provider.tsx to avoid import issues
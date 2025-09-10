"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { diagnosticEngine, DiagnosticResult } from '@/lib/diagnostic-engine'
import { workflowDiagnosticEngine } from '@/lib/workflow-diagnostics'
import { diagnosticLogger } from '@/lib/diagnostic-logger'

interface DiagnosticContextType {
  startupResults: DiagnosticResult[]
  workflowResults: DiagnosticResult[]
  isRunningDiagnostics: boolean
  runStartupDiagnostics: () => Promise<void>
  runWorkflowDiagnostics: (workflowId?: string) => Promise<void>
  getCriticalIssues: () => DiagnosticResult[]
  getHealthSummary: () => {
    healthy: number
    warnings: number
    errors: number
    total: number
  }
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined)

export function DiagnosticProvider({ children }: { children: React.ReactNode }) {
  const [startupResults, setStartupResults] = useState<DiagnosticResult[]>([])
  const [workflowResults, setWorkflowResults] = useState<DiagnosticResult[]>([])
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false)

  // Run startup diagnostics on mount
  useEffect(() => {
    runStartupDiagnostics()
  }, [])

  const runStartupDiagnostics = async () => {
    setIsRunningDiagnostics(true)
    try {
      diagnosticLogger.logDiagnostic('info', 'diagnostic-provider', 'Running startup diagnostics...')
      
      const results = await diagnosticEngine.runStartupDiagnostics()
      setStartupResults(results)
      
      // Log results
      diagnosticLogger.logDiagnosticResults(results)
      
      const criticalIssues = diagnosticEngine.getCriticalIssues(results)
      if (criticalIssues.length > 0) {
        diagnosticLogger.logDiagnostic(
          'error', 
          'diagnostic-provider', 
          `Found ${criticalIssues.length} critical issues during startup`,
          true,
          { criticalIssues: criticalIssues.map(issue => issue.message) }
        )
      } else {
        diagnosticLogger.logDiagnostic(
          'info', 
          'diagnostic-provider', 
          'Startup diagnostics completed successfully'
        )
      }
    } catch (error) {
      diagnosticLogger.logDiagnostic(
        'error',
        'diagnostic-provider',
        `Failed to run startup diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    } finally {
      setIsRunningDiagnostics(false)
    }
  }

  const runWorkflowDiagnostics = async (workflowId?: string) => {
    setIsRunningDiagnostics(true)
    try {
      const workflowName = workflowId ? `workflow ${workflowId}` : 'all workflows'
      diagnosticLogger.logDiagnostic('info', 'diagnostic-provider', `Running diagnostics for ${workflowName}...`)
      
      const results = await workflowDiagnosticEngine.runWorkflowDiagnostics(workflowId)
      setWorkflowResults(results)
      
      // Log results
      diagnosticLogger.logDiagnosticResults(results)
      
      const errors = results.filter(r => r.status === 'error')
      if (errors.length > 0) {
        diagnosticLogger.logDiagnostic(
          'warning', 
          'diagnostic-provider', 
          `Found ${errors.length} workflow issues`,
          false,
          { workflowErrors: errors.map(e => e.message) }
        )
      }
    } catch (error) {
      diagnosticLogger.logDiagnostic(
        'error',
        'diagnostic-provider',
        `Failed to run workflow diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    } finally {
      setIsRunningDiagnostics(false)
    }
  }

  const getCriticalIssues = (): DiagnosticResult[] => {
    const startupCritical = diagnosticEngine.getCriticalIssues(startupResults)
    const workflowCritical = workflowResults.filter(r => r.status === 'error')
    return [...startupCritical, ...workflowCritical]
  }

  const getHealthSummary = () => {
    const allResults = [...startupResults, ...workflowResults]
    return {
      healthy: allResults.filter(r => r.status === 'healthy').length,
      warnings: allResults.filter(r => r.status === 'warning').length,
      errors: allResults.filter(r => r.status === 'error').length,
      total: allResults.length
    }
  }

  return (
    <DiagnosticContext.Provider
      value={{
        startupResults,
        workflowResults,
        isRunningDiagnostics,
        runStartupDiagnostics,
        runWorkflowDiagnostics,
        getCriticalIssues,
        getHealthSummary,
      }}
    >
      {children}
    </DiagnosticContext.Provider>
  )
}

export function useDiagnostics() {
  const context = useContext(DiagnosticContext)
  if (context === undefined) {
    throw new Error('useDiagnostics must be used within a DiagnosticProvider')
  }
  return context
}

// Runtime diagnostic hooks for critical workflows
export function useWorkflowDiagnostics(workflowId: string) {
  const { runWorkflowDiagnostics, workflowResults } = useDiagnostics()
  
  const triggerDiagnostics = React.useCallback(async () => {
    await runWorkflowDiagnostics(workflowId)
  }, [workflowId, runWorkflowDiagnostics])

  const workflowSpecificResults = workflowResults.filter(r => 
    r.componentId.startsWith(workflowId)
  )

  return {
    results: workflowSpecificResults,
    triggerDiagnostics,
    hasErrors: workflowSpecificResults.some(r => r.status === 'error'),
    hasWarnings: workflowSpecificResults.some(r => r.status === 'warning')
  }
}

// Form validation diagnostic wrapper
export function useFormDiagnostics(formId: string) {
  const validateField = React.useCallback((fieldName: string, value: any, rules: any[]) => {
    const errors: string[] = []
    
    rules.forEach(rule => {
      try {
        if (typeof rule === 'function') {
          const result = rule(value)
          if (result !== true) {
            errors.push(typeof result === 'string' ? result : `Validation failed for ${fieldName}`)
          }
        } else if (rule.required && (!value || value === '')) {
          errors.push(`${fieldName} is required`)
        } else if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.message || `${fieldName} format is invalid`)
        }
      } catch (error) {
        diagnosticLogger.reportFormValidationError(
          formId,
          fieldName,
          `Validation rule error: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })

    if (errors.length > 0) {
      diagnosticLogger.reportFormValidationError(formId, fieldName, errors[0])
    }

    return errors
  }, [formId])

  const reportFormSubmission = React.useCallback((success: boolean, data?: any) => {
    if (success) {
      diagnosticLogger.logDiagnostic('info', `form-${formId}`, 'Form submitted successfully', false, data)
    } else {
      diagnosticLogger.logDiagnostic('error', `form-${formId}`, 'Form submission failed', true, data)
    }
  }, [formId])

  return {
    validateField,
    reportFormSubmission
  }
}

// API call diagnostic wrapper
export function useApiDiagnostics() {
  const wrapApiCall = React.useCallback(
    async (
      endpoint: string,
      method: string,
      apiCall: () => Promise<any>,
      options?: { showErrors?: boolean; critical?: boolean }
    ) => {
      const { showErrors = true, critical = false } = options || {}
      
      try {
        diagnosticLogger.logDiagnostic('info', 'api-client', `Making ${method} request to ${endpoint}`)
        
        const result = await apiCall()
        
        diagnosticLogger.logDiagnostic('info', 'api-client', `${method} ${endpoint} succeeded`)
        
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown API error'
        
        diagnosticLogger.reportApiError(endpoint, method, errorMessage, undefined, error)
        
        if (critical) {
          diagnosticLogger.logDiagnostic(
            'error',
            'api-client',
            `Critical API failure: ${method} ${endpoint}`,
            true,
            { error: errorMessage }
          )
        }
        
        throw error
      }
    },
    []
  )

  return { wrapApiCall }
}
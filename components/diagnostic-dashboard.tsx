"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Activity, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Download, 
  RefreshCw, 
  Server, 
  Settings,
  TrendingUp,
  Users,
  Workflow
} from 'lucide-react'
import { useDiagnostics } from './diagnostic-provider'
import { diagnosticLogger, DiagnosticLogEntry } from '@/lib/diagnostic-logger'
import { diagnosticEngine } from '@/lib/diagnostic-engine'
import { workflowDiagnosticEngine } from '@/lib/workflow-diagnostics'

interface DiagnosticDashboardProps {
  isDevMode?: boolean
  className?: string
}

export function DiagnosticDashboard({ isDevMode = false, className }: DiagnosticDashboardProps) {
  const {
    startupResults,
    workflowResults,
    isRunningDiagnostics,
    runStartupDiagnostics,
    runWorkflowDiagnostics,
    getCriticalIssues,
    getHealthSummary
  } = useDiagnostics()

  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([])
  const [selectedComponent, setSelectedComponent] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    const updateLogs = () => {
      setLogs(diagnosticLogger.getLogs())
    }

    updateLogs()
    const unsubscribe = diagnosticLogger.subscribe(updateLogs)

    return unsubscribe
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        runStartupDiagnostics()
        runWorkflowDiagnostics()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, runStartupDiagnostics, runWorkflowDiagnostics])

  const healthSummary = getHealthSummary()
  const criticalIssues = getCriticalIssues()
  const recentLogs = logs.slice(0, 50)
  const criticalLogs = diagnosticLogger.getCriticalIssues(60)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const exportDiagnosticData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      healthSummary,
      startupResults,
      workflowResults,
      logs: logs.slice(0, 100), // Last 100 logs
      components: diagnosticEngine.getAllComponents(),
      workflows: workflowDiagnosticEngine.getAllWorkflows()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagnostic-report-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isDevMode && process.env.NODE_ENV === 'production') {
    return null // Don't show in production unless explicitly enabled
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Diagnostics</h2>
          <p className="text-muted-foreground">
            Real-time system health monitoring and component status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportDiagnosticData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              runStartupDiagnostics()
              runWorkflowDiagnostics()
            }}
            disabled={isRunningDiagnostics}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthSummary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthSummary.healthy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{healthSummary.warnings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{healthSummary.errors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalIssues.length} critical system issues require immediate attention.
            <ul className="mt-2 list-disc list-inside">
              {criticalIssues.slice(0, 3).map((issue, index) => (
                <li key={index} className="text-sm">{issue.message}</li>
              ))}
              {criticalIssues.length > 3 && (
                <li className="text-sm">...and {criticalIssues.length - 3} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">
            <Server className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Database className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Components Status</CardTitle>
              <CardDescription>
                Real-time status of all registered system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {startupResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.dependencies && result.dependencies.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Dependencies: {result.dependencies.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(result.status)}
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Workflow Health</CardTitle>
              <CardDescription>
                Status of critical business workflows (sign-up, invoice creation, payments)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {workflowResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-blue-600">
                                View Details
                              </summary>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(result.status)}
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system logs and events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {recentLogs.map((log, index) => (
                      <div key={log.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                            {log.level}
                          </Badge>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-blue-600">{log.component}: </span>
                          <span>{log.message}</span>
                        </div>
                        {index < recentLogs.length - 1 && <Separator className="mt-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critical Issues</CardTitle>
                <CardDescription>Errors and warnings from the last hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {criticalLogs.map((log, index) => (
                      <div key={log.id} className="text-sm p-2 border-l-2 border-red-500 bg-red-50">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge variant="destructive">{log.level}</Badge>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-red-600">{log.component}: </span>
                          <span className="text-red-800">{log.message}</span>
                        </div>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-red-600">
                              Error Details
                            </summary>
                            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Environment and configuration details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Environment:</span>
                  <Badge>{process.env.NODE_ENV || 'unknown'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Diagnostic Mode:</span>
                  <Badge variant={isDevMode ? 'default' : 'secondary'}>
                    {isDevMode ? 'Development' : 'Production'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Auto Refresh:</span>
                  <Badge variant={autoRefresh ? 'default' : 'outline'}>
                    {autoRefresh ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Refresh:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Diagnostic and maintenance actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => diagnosticLogger.clearLogs()}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear Diagnostic Logs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={exportDiagnosticData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Full Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    runStartupDiagnostics()
                    runWorkflowDiagnostics()
                  }}
                  disabled={isRunningDiagnostics}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                  Run Full Diagnostics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
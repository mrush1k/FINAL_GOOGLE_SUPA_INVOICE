import { DiagnosticDashboard } from '@/components/diagnostic-dashboard'
import { ProtectedRoute } from '@/components/protected-route'

export default function DiagnosticsPage() {
  const isDevMode = process.env.NODE_ENV === 'development' || 
                   process.env.NEXT_PUBLIC_ENABLE_DIAGNOSTICS === 'true'

  if (!isDevMode) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Diagnostics Unavailable</h1>
            <p className="text-muted-foreground">
              Diagnostic dashboard is only available in development mode or when explicitly enabled.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <DiagnosticDashboard isDevMode={isDevMode} />
      </div>
    </ProtectedRoute>
  )
}
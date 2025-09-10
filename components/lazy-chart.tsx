"use client"

import dynamic from 'next/dynamic'

// Main chart components with loading states
export const LazyLineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-muted rounded-md" />
})

export const LazyBarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-muted rounded-md" />
})

export const LazyPieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-muted rounded-md" />
})
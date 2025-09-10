"use client"

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import type { CalendarProps } from '@/components/ui/calendar'

const CalendarComponent = dynamic(() => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-muted rounded-md" />
}) as ComponentType<CalendarProps>

export const LazyCalendar = CalendarComponent
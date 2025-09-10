"use client"

import React, { useState, useEffect } from 'react'
import { Input } from './input'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar, CalendarIcon } from 'lucide-react'
import { LazyCalendar } from '../lazy-calendar'
import { format, parse, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateInputProps {
  value?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY'
  disabled?: boolean
  className?: string
}

export function DateInput({ 
  value, 
  onChange, 
  placeholder = "Select date",
  dateFormat = 'DD/MM/YYYY',
  disabled = false,
  className 
}: DateInputProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Format patterns for parsing
  const formatPattern = dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'
  const displayFormat = dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'

  // Initialize input value from prop
  useEffect(() => {
    if (value) {
      const dateValue = value instanceof Date ? value : new Date(value)
      if (isValid(dateValue)) {
        setInputValue(format(dateValue, displayFormat))
      }
    } else {
      setInputValue('')
    }
  }, [value, displayFormat])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setInputValue(input)

    // Try to parse the input as a date
    if (input.length >= 8) { // minimum length for a date
      try {
        // Try multiple parsing strategies
        let parsedDate: Date | undefined

        // Strategy 1: Parse with the selected format
        parsedDate = parse(input, formatPattern, new Date())
        
        // Strategy 2: If format is DD/MM/YYYY, also try MM/DD/YYYY
        if (!isValid(parsedDate) && dateFormat === 'DD/MM/YYYY') {
          parsedDate = parse(input, 'MM/dd/yyyy', new Date())
        }
        
        // Strategy 3: If format is MM/DD/YYYY, also try DD/MM/YYYY
        if (!isValid(parsedDate) && dateFormat === 'MM/DD/YYYY') {
          parsedDate = parse(input, 'dd/MM/yyyy', new Date())
        }

        // Strategy 4: Try with dashes
        if (!isValid(parsedDate)) {
          const withDashes = input.replace(/\//g, '-')
          parsedDate = new Date(withDashes)
        }

        // Strategy 5: Try with dots
        if (!isValid(parsedDate)) {
          const withDots = input.replace(/\./g, '/')
          parsedDate = parse(withDots, formatPattern, new Date())
        }

        if (isValid(parsedDate)) {
          onChange(parsedDate)
        }
      } catch (error) {
        // Invalid date, don't call onChange
      }
    }
  }

  const handleInputBlur = () => {
    // If we have a valid parsed date from onChange, format the input nicely
    if (value) {
      const dateValue = value instanceof Date ? value : new Date(value)
      if (isValid(dateValue)) {
        setInputValue(format(dateValue, displayFormat))
      }
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date)
    if (date && isValid(date)) {
      setInputValue(format(date, displayFormat))
    }
    setOpen(false)
  }

  const currentDate = value ? (value instanceof Date ? value : new Date(value)) : undefined
  const isValidDate = currentDate && isValid(currentDate)

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        className={cn(
          "flex-1",
          !isValidDate && inputValue.length > 0 && "border-red-300 focus:border-red-500"
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="px-3"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <LazyCalendar
            mode="single"
            selected={isValidDate ? currentDate : undefined}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
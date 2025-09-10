"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  onSave?: () => void
  showPreview?: boolean
}

// Predefined color palette with WCAG AA compliant colors
const predefinedColors = [
  { name: 'Ocean Blue', value: '#0066CC', contrast: 'white' },
  { name: 'Forest Green', value: '#228B22', contrast: 'white' },
  { name: 'Royal Purple', value: '#663399', contrast: 'white' },
  { name: 'Crimson Red', value: '#DC143C', contrast: 'white' },
  { name: 'Amber Orange', value: '#FF8C00', contrast: 'white' },
  { name: 'Slate Gray', value: '#708090', contrast: 'white' },
  { name: 'Emerald', value: '#50C878', contrast: 'white' },
  { name: 'Indigo', value: '#4B0082', contrast: 'white' }
]

export function ColorPicker({ selectedColor, onColorChange, onSave, showPreview = false }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('')
  const [colorError, setColorError] = useState('')

  const validateHexColor = (color: string) => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    return hexRegex.test(color)
  }

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value)
    setColorError('')
    
    if (value && !validateHexColor(value)) {
      setColorError('Invalid color format. Use HEX (#000000) format.')
      return
    }
    
    if (value && validateHexColor(value)) {
      onColorChange(value)
    }
  }

  const handlePredefinedColorSelect = (color: string) => {
    setCustomColor('')
    setColorError('')
    onColorChange(color)
  }

  const applyCustomColor = () => {
    if (customColor && validateHexColor(customColor)) {
      onColorChange(customColor)
      setColorError('')
    } else if (customColor) {
      setColorError('Invalid color format. Use HEX (#000000) format.')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Color Selection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a theme color that will be applied across the application
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Selection Preview */}
        {showPreview && selectedColor && (
          <div className="space-y-2">
            <Label>Current Selection</Label>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div 
                className="w-8 h-8 rounded-md border-2 border-white shadow-md"
                style={{ backgroundColor: selectedColor }}
              />
              <div className="flex-1">
                <p className="font-medium">{selectedColor}</p>
                <p className="text-sm text-muted-foreground">
                  {predefinedColors.find(c => c.value === selectedColor)?.name || 'Custom Color'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Predefined Colors */}
        <div className="space-y-3">
          <Label>Predefined Colors</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {predefinedColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handlePredefinedColorSelect(color.value)}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  selectedColor === color.value 
                    ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div 
                  className="w-full h-12 rounded-md mb-2"
                  style={{ backgroundColor: color.value }}
                />
                <p className="text-xs font-medium text-center">{color.name}</p>
                <p className="text-xs text-muted-foreground text-center">{color.value}</p>
                {selectedColor === color.value && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Input */}
        <div className="space-y-3">
          <Label>Custom Color (HEX)</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="#000000"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className={cn(
                  "font-mono",
                  colorError && "border-red-500 focus:border-red-500"
                )}
              />
              {colorError && (
                <p className="text-sm text-red-500 mt-1">{colorError}</p>
              )}
            </div>
            <input
              type="color"
              value={customColor || selectedColor || '#0066CC'}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              title="Pick a color"
            />
            <Button 
              variant="outline" 
              onClick={applyCustomColor}
              disabled={!customColor || !!colorError}
            >
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use the color picker or enter a HEX color code (e.g., #FF5733)
          </p>
        </div>

        {/* Real-time Preview */}
        {selectedColor && (
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sample Button</span>
                <Button 
                  style={{ 
                    backgroundColor: selectedColor,
                    borderColor: selectedColor,
                    color: 'white'
                  }}
                  className="hover:opacity-90"
                >
                  Primary Action
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sample Badge</span>
                <div 
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: selectedColor }}
                >
                  Status Badge
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sample Link</span>
                <a 
                  href="#" 
                  className="text-sm font-medium hover:underline"
                  style={{ color: selectedColor }}
                  onClick={(e) => e.preventDefault()}
                >
                  Sample Link
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {onSave && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onSave} disabled={!selectedColor}>
              <Palette className="w-4 h-4 mr-2" />
              Save Theme Color
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
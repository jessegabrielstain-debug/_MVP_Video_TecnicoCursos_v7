// TODO: Fixar tipos HexColorPicker do react-colorful
'use client'

import { HexColorPicker } from 'react-colorful'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ColorPickerProps {
  label: string
  color: string
  onChange: (color: string) => void
  presetColors?: string[]
}

const DEFAULT_PRESETS = [
  '#0066cc', '#ff6b35', '#28a745', '#dc3545', '#ffc107', 
  '#6f42c1', '#20c997', '#fd7e14', '#e83e8c', '#6c757d'
]

export default function ColorPicker({ 
  label, 
  color, 
  onChange, 
  presetColors = DEFAULT_PRESETS 
}: ColorPickerProps) {
  
  const handleColorChange = (newColor: string) => {
    onChange(newColor)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      onChange(value)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Preview */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1">
            <Label htmlFor={`color-${label}`}>Código HEX</Label>
            <Input
              id={`color-${label}`}
              value={color}
              onChange={handleInputChange}
              placeholder="#0066cc"
              className="font-mono"
            />
          </div>
        </div>

        {/* Color Picker */}
        <div className="flex justify-center" style={{ width: '200px', height: '200px', margin: '0 auto' }}>
          <HexColorPicker 
            color={color} 
            onChange={handleColorChange}
          />
        </div>

        {/* Preset Colors */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Cores Predefinidas</Label>
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((presetColor) => (
              <Button
                key={presetColor}
                variant="outline"
                className="w-8 h-8 p-0 border-2"
                style={{ 
                  backgroundColor: presetColor,
                  borderColor: color === presetColor ? '#000' : '#ccc'
                }}
                onClick={() => onChange(presetColor)}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

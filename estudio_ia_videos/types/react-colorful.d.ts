declare module 'react-colorful' {
  import * as React from 'react'

  export interface ColorPickerProps {
    color?: string
    onChange?: (color: string) => void
    className?: string
  }

  export const HexColorPicker: React.FC<ColorPickerProps>
  export const RgbColorPicker: React.FC<ColorPickerProps>
  export const HslColorPicker: React.FC<ColorPickerProps>
  export const RgbaColorPicker: React.FC<ColorPickerProps>
  export const HslaColorPicker: React.FC<ColorPickerProps>
  export const HexColorInput: React.FC<{
    color?: string
    onChange?: (color: string) => void
    className?: string
    prefixed?: boolean
  }>
}

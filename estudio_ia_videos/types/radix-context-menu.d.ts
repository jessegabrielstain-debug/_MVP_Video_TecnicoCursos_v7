declare module '@radix-ui/react-context-menu' {
  import * as React from 'react'

  export const Root: React.FC<{ children: React.ReactNode }>
  export const Trigger: React.FC<React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean }>
  export const Portal: React.FC<{ children: React.ReactNode; container?: HTMLElement }>
  export const Content: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      sideOffset?: number
      alignOffset?: number
      className?: string
    } & React.RefAttributes<HTMLDivElement>
  >
  export const Item: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      disabled?: boolean
      onSelect?: (event: Event) => void
      className?: string
      inset?: boolean
    } & React.RefAttributes<HTMLDivElement>
  >
  export const CheckboxItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      checked?: boolean
      onCheckedChange?: (checked: boolean) => void
      disabled?: boolean
    } & React.RefAttributes<HTMLDivElement>
  >
  export const RadioGroup: React.FC<{ value?: string; onValueChange?: (value: string) => void; children: React.ReactNode }>
  export const RadioItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      value: string
      disabled?: boolean
    } & React.RefAttributes<HTMLDivElement>
  >
  export const Label: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      inset?: boolean
      className?: string
    } & React.RefAttributes<HTMLDivElement>
  >
  export const Separator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const Sub: React.FC<{ children: React.ReactNode }>
  export const SubTrigger: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      disabled?: boolean
      inset?: boolean
      className?: string
    } & React.RefAttributes<HTMLDivElement>
  >
  export const SubContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      sideOffset?: number
      className?: string
    } & React.RefAttributes<HTMLDivElement>
  >
  export const ItemIndicator: React.FC<{ children: React.ReactNode; className?: string }>
}

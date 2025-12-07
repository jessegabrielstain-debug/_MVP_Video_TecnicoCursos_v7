declare module 'react-plotly.js' {
  import * as React from 'react'
  import { PlotData, Layout, Config, Frame } from 'plotly.js'

  export interface PlotParams {
    data: Partial<PlotData>[]
    layout?: Partial<Layout>
    config?: Partial<Config>
    frames?: Frame[]
    revision?: number
    onInitialized?: (figure: Readonly<{ data: PlotData[]; layout: Layout }>, graphDiv: HTMLElement) => void
    onUpdate?: (figure: Readonly<{ data: PlotData[]; layout: Layout }>, graphDiv: HTMLElement) => void
    onPurge?: (figure: Readonly<{ data: PlotData[]; layout: Layout }>, graphDiv: HTMLElement) => void
    onError?: (err: Error) => void
    divId?: string
    className?: string
    style?: React.CSSProperties
    useResizeHandler?: boolean
  }

  const Plot: React.FC<PlotParams>
  export default Plot
}

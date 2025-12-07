declare module 'react-window' {
  import { ComponentType, CSSProperties, Ref, Component } from 'react';

  export interface ListProps {
    className?: string;
    children: ComponentType<{ index: number; style: CSSProperties }>;
    height: number | string;
    itemCount: number;
    itemSize: number | ((index: number) => number);
    layout?: 'vertical' | 'horizontal';
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => void;
    outerElementType?: string | ComponentType;
    style?: CSSProperties;
    useIsScrolling?: boolean;
    width?: number | string;
    ref?: Ref<any>;
    overscanCount?: number;
  }

  export class FixedSizeList extends Component<ListProps> {}
  export class VariableSizeList extends Component<ListProps> {}
}

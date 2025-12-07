import { useRef } from 'react';

export function useRenderCounter(label: string) {
  const counter = useRef(0);
  counter.current++;
  if (process.env.NODE_ENV === 'development') {
    console.log(`${label} rendered ${counter.current} times`);
  }
}

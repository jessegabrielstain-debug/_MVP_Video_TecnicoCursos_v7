
/**
 * 🚀 Provider de Configurações de Produção + Emergency Fixes
 */

'use client';

import React, { useEffect } from 'react';
import { initializeEmergencyFixes } from '../../lib/emergency-fixes';

export default function ProductionProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    // 🚨 EMERGENCY: Initialize all emergency fixes
    initializeEmergencyFixes();

    // Aplicar configurações de produção no cliente
    if (process.env.NODE_ENV === 'production') {
      // Remover avisos de React DevTools
      if (typeof window !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = `
          /* Esconder elementos de desenvolvimento */
          [data-reactroot] { outline: none !important; }
          .react-dev-overlay { display: none !important; }
        `;
        document.head.appendChild(style);
      }

      // 🚨 EMERGENCY: Enhanced WebSocket blocking
      if (typeof WebSocket !== 'undefined') {
        const originalWebSocket = WebSocket;
        class BlockedWebSocket extends EventTarget implements WebSocket {
          binaryType: BinaryType = 'blob';
          readonly bufferedAmount = 0;
          readonly extensions = '';
          readonly protocol = '';
          readonly url: string;
          onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null;
          onerror: ((this: WebSocket, ev: Event) => unknown) | null = null;
          onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null;
          onopen: ((this: WebSocket, ev: Event) => unknown) | null = null;
          readonly readyState = WebSocket.CLOSED;

          constructor(targetUrl: string) {
            super();
            this.url = targetUrl;
          }

          get CONNECTING(): 0 {
            return WebSocket.CONNECTING as 0;
          }

          get OPEN(): 1 {
            return WebSocket.OPEN as 1;
          }

          get CLOSING(): 2 {
            return WebSocket.CLOSING as 2;
          }

          get CLOSED(): 3 {
            return WebSocket.CLOSED as 3;
          }

          close(_code?: number, _reason?: string): void {
            // noop
          }

          send(_data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
            // noop
          }

          addEventListener<T extends keyof WebSocketEventMap>(
            type: T,
            listener: (this: WebSocket, ev: WebSocketEventMap[T]) => unknown,
            options?: boolean | AddEventListenerOptions
          ): void {
            super.addEventListener(type, listener as EventListener, options);
          }

          removeEventListener<T extends keyof WebSocketEventMap>(
            type: T,
            listener: (this: WebSocket, ev: WebSocketEventMap[T]) => unknown,
            options?: boolean | EventListenerOptions
          ): void {
            super.removeEventListener(type, listener as EventListener, options);
          }

          dispatchEvent(event: Event): boolean {
            return super.dispatchEvent(event);
          }
        }

        window.WebSocket = class extends originalWebSocket {
          constructor(url: string | URL, protocols?: string | string[]) {
            const urlStr = url.toString();
            
            // Bloquear conexões HMR em qualquer ambiente
            if (urlStr.includes('webpack-hmr') || urlStr.includes('_next/webpack-hmr') || urlStr.includes('preview.abacusai.app')) {
              console.log('🚨 EMERGENCY: WebSocket HMR blocked');
              
              return new BlockedWebSocket(urlStr);
            }
            
            super(url, protocols);
          }
        } as any;
      }
    }

    // 🚨 EMERGENCY: Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('🚨 EMERGENCY: Global error caught', event.error);
      // Prevent error from breaking the app
      event.preventDefault();
      return true;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('🚨 EMERGENCY: Unhandled promise rejection', event.reason);
      // Prevent unhandled rejection from crashing
      event.preventDefault();
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}

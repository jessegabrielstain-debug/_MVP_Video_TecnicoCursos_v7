
"use client";

import React, { useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { FabricManager } from "@/lib/fabric-singleton";

interface CanvasClientProps {
  width?: number;
  height?: number;
  onReady?: (canvas: any) => void;
  className?: string;
}

export default function CanvasClient({ 
  width = 800, 
  height = 450, 
  onReady,
  className 
}: CanvasClientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadFabricAndInitCanvas = async () => {
      try {
        const fabric = await FabricManager.getInstance();
        
        if (!mounted || !fabric || !canvasRef.current || fabricCanvasRef.current) {
          return;
        }

        const canvas = new fabric.Canvas(canvasRef.current, {
          preserveObjectStacking: true,
          width,
          height
        });

        // Demo: add a rectangle
        canvas.add(
          new fabric.Rect({
            left: 50,
            top: 50,
            width: 120,
            height: 80,
            fill: "#4F46E5"
          })
        );

        fabricCanvasRef.current = canvas;
        setFabricLoaded(true);
        onReady?.(canvas);
      } catch (error) {
        logger.error("Erro ao carregar Fabric.js", error instanceof Error ? error : new Error(String(error)), { component: "CanvasClient" });
      }
    };

    loadFabricAndInitCanvas();

    return () => {
      mounted = false;
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [width, height, onReady]);

  if (!fabricLoaded) {
    return (
      <div className="flex items-center justify-center h-[450px] bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Iniciando Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ border: "1px solid #ccc", maxWidth: "100%" }}
    />
  );
}

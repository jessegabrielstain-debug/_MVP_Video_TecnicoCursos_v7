'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface NetflixItem {
  id: string
  title: string
  image: string
  duration?: string
  match?: number
  year?: number
  rating?: string
  description?: string
}

interface NetflixRowProps {
  title: string
  items: NetflixItem[]
  onSelect?: (item: NetflixItem) => void
}

export function NetflixRow({ title, items, onSelect }: NetflixRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isMoved, setIsMoved] = useState(false)

  const handleClick = (direction: 'left' | 'right') => {
    setIsMoved(true)
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current
      const scrollTo =
        direction === 'left'
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth

      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <div className="h-40 space-y-0.5 md:space-y-2 mb-8">
      <h2 className="w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
        {title}
      </h2>
      <div className="group relative md:-ml-2">
        <ChevronLeft
          className={cn(
            'absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100',
            !isMoved && 'hidden'
          )}
          onClick={() => handleClick('left')}
        />

        <div
          ref={rowRef}
          className="flex items-center space-x-0.5 overflow-x-scroll scrollbar-hide md:space-x-2.5 md:p-2"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105"
              onClick={() => onSelect && onSelect(item)}
            >
              <div className="relative h-full w-full rounded-sm object-cover md:rounded">
                 {/* Fallback gradient if no image */}
                 <div 
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center"
                    style={{ backgroundColor: item.image ? 'transparent' : '#1e293b' }}
                 >
                    {item.image ? (
                        <img
                        src={item.image}
                        alt={item.title}
                        className="rounded-sm object-cover md:rounded"
                        style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        <span className="text-sm font-bold text-white">{item.title}</span>
                    )}
                 </div>
              </div>
              
              {/* Hover Info (Simplified) */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-xs font-bold">{item.title}</p>
                  <p className="text-[10px] text-gray-300">{item.duration}</p>
              </div>
            </div>
          ))}
        </div>

        <ChevronRight
          className="absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100"
          onClick={() => handleClick('right')}
        />
      </div>
    </div>
  )
}

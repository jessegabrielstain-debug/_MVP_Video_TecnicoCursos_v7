'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

/** Tipos de seleção de data */
type DateSelection = Date | Date[] | { from: Date; to: Date } | undefined;

/** Mapa de classes CSS customizadas */
type ClassNamesMap = Record<string, string>;

export type CalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  mode?: 'single' | 'multiple' | 'range';
  selected?: DateSelection;
  onSelect?: (date: DateSelection) => void;
  className?: string;
  classNames?: ClassNamesMap;
  showOutsideDays?: boolean;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3 border rounded-md bg-background", className)}>
      <div className="text-center text-sm text-muted-foreground p-4">
        Calendar Component (Mock)
        <br />
        react-day-picker missing
      </div>
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

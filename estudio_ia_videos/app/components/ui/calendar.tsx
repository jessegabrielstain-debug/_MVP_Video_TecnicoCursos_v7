'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from: Date; to: Date } | undefined;
  onSelect?: (date: any) => void;
  className?: string;
  classNames?: any;
  showOutsideDays?: boolean;
  [key: string]: any;
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

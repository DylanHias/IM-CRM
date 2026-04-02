'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // value format: "YYYY-MM-DDThh:mm"
  const datePart = value ? value.split('T')[0] : '';
  const timePart = value ? value.split('T')[1] ?? '00:00' : '00:00';

  const selected = datePart ? parseISO(datePart) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}T${timePart}`);
    }
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (datePart) {
      onChange(`${datePart}T${newTime}`);
    } else {
      // If no date selected yet, use today
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}T${newTime}`);
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'flex-1 justify-start text-left font-normal',
              !datePart && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? format(selected, 'dd MMM yyyy') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            onSelect={handleDateSelect}
            defaultMonth={selected}
            startMonth={new Date(2000, 0)}
            endMonth={new Date(2060, 11)}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={timePart}
        onChange={handleTimeChange}
        disabled={disabled}
        className="w-[110px]"
      />
    </div>
  );
}

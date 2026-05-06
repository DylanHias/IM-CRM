'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minValue?: string; // "YYYY-MM-DDTHH:MM" — restricts selectable dates/times
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled,
  className,
  minValue,
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);

  const datePart = value ? value.split('T')[0] : '';
  const timePart = value ? value.split('T')[1] ?? '00:00' : '00:00';
  const [hour, minute] = timePart.split(':');

  const selected = datePart ? parseISO(datePart) : undefined;

  const minDatePart = minValue ? minValue.split('T')[0] : '';
  const minTimePart = minValue ? minValue.split('T')[1] ?? '00:00' : '';
  const [minHour, minMinute] = minTimePart ? minTimePart.split(':') : ['', ''];
  const minSelected = minDatePart ? parseISO(minDatePart) : undefined;

  const isHourDisabled = (h: string) => {
    if (!minValue || !datePart) return false;
    if (datePart > minDatePart) return false;
    if (datePart < minDatePart) return true;
    return h < minHour;
  };

  const isMinuteDisabled = (m: string) => {
    if (!minValue || !datePart) return false;
    if (datePart > minDatePart) return false;
    if (datePart < minDatePart) return true;
    if (hour > minHour) return false;
    if (hour < minHour) return true;
    return m < minMinute;
  };

  const getOrTodayDate = () => {
    if (datePart) return datePart;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}T${timePart}`);
    }
    setDateOpen(false);
  };

  const handleHourSelect = (h: string) => {
    onChange(`${getOrTodayDate()}T${h}:${minute}`);
  };

  const handleMinuteSelect = (m: string) => {
    onChange(`${getOrTodayDate()}T${hour}:${m}`);
  };

  const [timeInput, setTimeInput] = React.useState(`${hour}:${minute}`);

  React.useEffect(() => {
    setTimeInput(`${hour}:${minute}`);
  }, [hour, minute]);

  const commitTimeInput = (raw: string) => {
    const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) {
      setTimeInput(`${hour}:${minute}`);
      return;
    }
    const h = Math.min(23, parseInt(match[1], 10));
    const m = Math.min(59, parseInt(match[2], 10));
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');

    if (minValue && datePart) {
      if (datePart === minDatePart) {
        if (hStr < minHour || (hStr === minHour && mStr < minMinute)) {
          setTimeInput(`${hour}:${minute}`);
          return;
        }
      } else if (datePart < minDatePart) {
        setTimeInput(`${hour}:${minute}`);
        return;
      }
    }

    onChange(`${getOrTodayDate()}T${hStr}:${mStr}`);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
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
            disabled={minSelected ? (date) => date < minSelected : undefined}
          />
        </PopoverContent>
      </Popover>

      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
        <div className="relative w-[110px]">
          <Input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            onBlur={(e) => commitTimeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitTimeInput(e.currentTarget.value);
              }
            }}
            placeholder="HH:MM"
            className="pr-8 font-normal"
            aria-label="Time"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Open time picker"
              className="absolute right-0 top-0 h-10 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Clock className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            <ScrollArea className="h-48 w-14">
              <div className="flex flex-col">
                {HOURS.map((h) => (
                  <Button
                    key={h}
                    variant="ghost"
                    size="sm"
                    disabled={isHourDisabled(h)}
                    className={cn(
                      'w-full justify-center text-sm',
                      h === hour && 'bg-accent text-accent-foreground font-medium'
                    )}
                    onClick={() => handleHourSelect(h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <div className="flex items-center px-1 text-muted-foreground font-medium">:</div>
            <ScrollArea className="h-48 w-14">
              <div className="flex flex-col">
                {MINUTES.map((m) => (
                  <Button
                    key={m}
                    variant="ghost"
                    size="sm"
                    disabled={isMinuteDisabled(m)}
                    className={cn(
                      'w-full justify-center text-sm',
                      m === minute && 'bg-accent text-accent-foreground font-medium'
                    )}
                    onClick={() => handleMinuteSelect(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

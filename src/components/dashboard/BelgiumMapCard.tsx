'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BELGIAN_CITIES } from '@/lib/geo/belgianCities';

// viewBox="0 0 800 600"
// Projection: x = (lng - 2.4) * 195,  y = (51.6 - lat) * 275
const BELGIUM_PATH =
  'M 29,144 L 189,62 L 273,36 L 361,36 L 394,88 L 468,36 L 527,50 L 671,83 ' +
  'L 721,226 L 737,344 L 682,559 L 478,564 L 351,398 L 195,390 L 140,289 Z';

function pinRadius(count: number): number {
  return Math.min(14, Math.max(4, 4 + Math.log2(count + 1) * 2.2));
}

interface CityCount {
  cityId: string;
  n: number;
}

interface Props {
  cityCounts: CityCount[];
  totalCustomers: number;
  className?: string;
}

export function BelgiumMapCard({ cityCounts, totalCustomers, className }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const cityMap = new Map(cityCounts.map((c) => [c.cityId, c.n]));
  const plotted = BELGIAN_CITIES.filter((c) => (cityMap.get(c.id) ?? 0) > 0);
  const citiesShown = plotted.length;

  const hoveredCity = hovered ? BELGIAN_CITIES.find((c) => c.id === hovered) : null;
  const hoveredCount = hoveredCity ? (cityMap.get(hoveredCity.id) ?? 0) : 0;

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden', className)}>
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Customers in Belgium
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalCustomers} {totalCustomers === 1 ? 'customer' : 'customers'} across{' '}
          {citiesShown} {citiesShown === 1 ? 'city' : 'cities'}
        </p>
      </div>

      <div className="px-3 pb-3">
        <div className="aspect-[4/3] w-full relative">
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Belgium outline */}
            <path
              d={BELGIUM_PATH}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* City pins */}
            {BELGIAN_CITIES.map((city) => {
              const count = cityMap.get(city.id) ?? 0;
              if (count === 0) return null;
              const r = pinRadius(count);
              const isHovered = hovered === city.id;

              return (
                <g
                  key={city.id}
                  onMouseEnter={() => setHovered(city.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'default' }}
                >
                  {/* Halo ring */}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={r + 3}
                    fill="hsl(var(--background))"
                    opacity={0.8}
                  />
                  {/* Pin */}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={isHovered ? r + 1 : r}
                    fill="hsl(var(--primary))"
                    opacity={0.9}
                    style={{ transition: 'r 0.1s ease' }}
                  />
                  {/* City label */}
                  <text
                    x={city.x}
                    y={city.y + r + 12}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={9}
                    fontWeight={500}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {city.displayName}
                  </text>
                </g>
              );
            })}

            {/* Hover tooltip */}
            {hoveredCity && (() => {
              const tw = 130;
              const th = 40;
              // Clamp so the tooltip doesn't escape the viewBox
              const tx = Math.min(hoveredCity.x + 14, 800 - tw - 4);
              const ty = Math.max(hoveredCity.y - th - 4, 4);
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={tx}
                    y={ty}
                    width={tw}
                    height={th}
                    rx={5}
                    fill="hsl(var(--popover))"
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  />
                  <text
                    x={tx + 9}
                    y={ty + 14}
                    fill="hsl(var(--popover-foreground))"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {hoveredCity.displayName}
                  </text>
                  <text
                    x={tx + 9}
                    y={ty + 28}
                    fill="hsl(var(--muted-foreground))"
                    fontSize={10}
                  >
                    {hoveredCount} {hoveredCount === 1 ? 'customer' : 'customers'}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Empty state overlay */}
          {citiesShown === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-muted-foreground bg-card/80 px-3 py-1.5 rounded-md">
                No Belgian customers synced yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

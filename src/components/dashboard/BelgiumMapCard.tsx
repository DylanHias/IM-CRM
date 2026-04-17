'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BELGIAN_CITIES } from '@/lib/geo/belgianCities';
import { BELGIUM_PROVINCES } from '@/lib/geo/belgiumProvinces';

// viewBox="0 0 800 600"
// Projection: x = (lng - 2.4) * 195,  y = (51.6 - lat) * 275

function pinPath(cx: number, cy: number, r: number): string {
  const hy = cy - r * 2.8;
  return `M ${cx},${cy} L ${cx - r},${hy} A ${r},${r},0,0,0,${cx + r},${hy} Z`;
}

function pinRadius(count: number): number {
  return Math.min(9, Math.max(3, 3 + Math.log2(count + 1) * 1.8));
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
            {/* Province fills */}
            {BELGIUM_PROVINCES.map((province) => (
              <path
                key={province.id}
                d={province.path}
                fill="hsl(var(--muted))"
                stroke="hsl(var(--background))"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ))}

            {/* Province outlines (thin, on top of fills) */}
            {BELGIUM_PROVINCES.map((province) => (
              <path
                key={`outline-${province.id}`}
                d={province.path}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.75"
                strokeLinejoin="round"
              />
            ))}

            {/* City pins */}
            {BELGIAN_CITIES.map((city) => {
              const count = cityMap.get(city.id) ?? 0;
              if (count === 0) return null;
              const r = pinRadius(count);
              const isHovered = hovered === city.id;
              const pr = isHovered ? r + 1 : r;

              return (
                <g
                  key={city.id}
                  onMouseEnter={() => setHovered(city.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'default' }}
                >
                  {/* Drop shadow */}
                  <path
                    d={pinPath(city.x + 1, city.y + 1, pr)}
                    fill="hsl(var(--background))"
                    opacity={0.4}
                  />
                  {/* Pin body */}
                  <path
                    d={pinPath(city.x, city.y, pr)}
                    fill="hsl(var(--primary))"
                    opacity={0.9}
                  />
                  {/* Pin hole */}
                  <circle
                    cx={city.x}
                    cy={city.y - pr * 2.8}
                    r={pr * 0.3}
                    fill="hsl(var(--background))"
                    opacity={0.65}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* City label */}
                  <text
                    x={city.x}
                    y={city.y + 10}
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
              const tx = Math.min(hoveredCity.x + 14, 800 - tw - 4);
              const ty = Math.max(hoveredCity.y - th - 16, 4);
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

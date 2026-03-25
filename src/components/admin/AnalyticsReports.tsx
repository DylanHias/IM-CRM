'use client';

import { useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 220 70% 50%))',
  'hsl(var(--chart-3, 150 60% 40%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(var(--destructive))',
  'hsl(var(--warning, 45 93% 47%))',
  'hsl(var(--muted-foreground))',
];

export function AnalyticsReports() {
  const {
    dataQuality, activityByType, activityByMonth,
    activityByUser, pipelineByStage, winRate,
    isLoading, loadAnalytics,
  } = useAdminStore();

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading && !dataQuality) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics...</p>;
  }

  const winRateData = winRate
    ? [
        { name: 'Won', value: winRate.won },
        { name: 'Lost', value: winRate.lost },
        { name: 'Open', value: winRate.open },
      ].filter((d) => d.value > 0)
    : [];

  const qualityCards = dataQuality ? [
    { label: 'Customers w/o Contacts', value: dataQuality.customersWithoutContacts, total: dataQuality.totalCustomers },
    { label: 'Customers w/o Recent Activity', value: dataQuality.customersWithoutRecentActivity, total: dataQuality.totalCustomers },
    { label: 'Stale Opportunities', value: dataQuality.staleOpportunities },
  ] : [];

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Analytics & Reports</h2>

      {/* Data Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {qualityCards.map(({ label, value, total }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">
              {value}
              {total !== undefined && (
                <span className="text-xs font-normal text-muted-foreground"> / {total}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activities by Type */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities by Type</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityByType}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activities by Month */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities by Month</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline by Stage */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline by Stage</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis yAxisId="count" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="count" dataKey="count" fill="hsl(var(--primary))" name="Count" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="revenue" dataKey="totalRevenue" fill="hsl(var(--chart-2, 220 70% 50%))" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Win Rate</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={winRateData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {winRateData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activities by User */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities by User</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activityByUser} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="userName" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

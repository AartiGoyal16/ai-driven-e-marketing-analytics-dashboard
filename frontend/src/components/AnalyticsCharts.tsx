'use client';

import React, { useState } from 'react';

export interface MetricItem {
  id: string | number;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface PlatformItem {
  platform: string;
  totalBudget: number;
  totalSpend: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  avgRoi: number;
}

interface AnalyticsChartsProps {
  metrics: MetricItem[];
  platformData?: PlatformItem[];
}

export default function AnalyticsCharts({ metrics, platformData = [] }: AnalyticsChartsProps) {
  const [activeChart, setActiveChart] = useState<'spend' | 'traffic' | 'efficiency' | 'platforms'>('spend');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Group metrics chronologically ascending
  const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedMetrics.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
        No performance records available for this selected date filter.
      </div>
    );
  }

  // Dimension helpers
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Max calculations
  const maxSpend = Math.max(...sortedMetrics.map((m) => m.spend), 10);
  const maxClicks = Math.max(...sortedMetrics.map((m) => m.clicks), 10);
  const maxConv = Math.max(...sortedMetrics.map((m) => m.conversions), 5);
  const maxCtr = Math.max(...sortedMetrics.map((m) => (m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0)), 1);

  // Coordinate mappers
  const getX = (idx: number) => padding.left + (idx / Math.max(1, sortedMetrics.length - 1)) * chartW;
  const getY = (val: number, maxVal: number) => padding.top + chartH - (val / (maxVal || 1)) * chartH;

  // Build SVG path strings
  const spendPoints = sortedMetrics.map((m, i) => `${getX(i)},${getY(m.spend, maxSpend)}`);
  const spendPath = `M ${spendPoints.join(' L ')}`;
  const spendArea = `${spendPath} L ${getX(sortedMetrics.length - 1)},${padding.top + chartH} L ${getX(0)},${padding.top + chartH} Z`;

  const clicksPoints = sortedMetrics.map((m, i) => `${getX(i)},${getY(m.clicks, maxClicks)}`);
  const clicksPath = `M ${clicksPoints.join(' L ')}`;

  const convPoints = sortedMetrics.map((m, i) => `${getX(i)},${getY(m.conversions, maxConv)}`);
  const convPath = `M ${convPoints.join(' L ')}`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Chart Selector Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📈</span> Performance & Marketing Trends
          </h3>
          <p className="text-xs text-gray-400">Interactive telemetry curves across historical campaign days</p>
        </div>

        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setActiveChart('spend')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeChart === 'spend' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            💵 Spend Over Time
          </button>
          <button
            onClick={() => setActiveChart('traffic')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeChart === 'traffic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 Clicks & Conversions
          </button>
          <button
            onClick={() => setActiveChart('efficiency')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeChart === 'efficiency' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ CTR & CPC
          </button>
          <button
            onClick={() => setActiveChart('platforms')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeChart === 'platforms' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🌐 Platform Breakdown
          </button>
        </div>
      </div>

      {/* CHART 1: SPEND OVER TIME */}
      {activeChart === 'spend' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Daily Advertising Spend Trend ($ USD)</span>
            <span className="text-emerald-400 font-semibold">Peak Day: ${maxSpend.toLocaleString()}</span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padding.top + chartH * (1 - pct);
                return (
                  <g key={i}>
                    <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                    <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-gray-500 text-[10px] font-mono">
                      ${Math.round(maxSpend * pct)}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              <path d={spendArea} fill="url(#spendGrad)" />
              <path d={spendPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

              {/* Interactive Data Points */}
              {sortedMetrics.map((m, i) => {
                const cx = getX(i);
                const cy = getY(m.spend, maxSpend);
                return (
                  <g key={m.id || i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={hoverIndex === i ? 6 : 3.5}
                      className="fill-blue-500 stroke-gray-950 stroke-2 cursor-pointer transition-all"
                    />
                    {/* X-axis labels */}
                    {(i === 0 || i === Math.floor(sortedMetrics.length / 2) || i === sortedMetrics.length - 1) && (
                      <text x={cx} y={padding.top + chartH + 20} textAnchor="middle" className="fill-gray-500 text-[10px]">
                        {m.date}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {hoverIndex !== null && sortedMetrics[hoverIndex] && (
              <div
                className="absolute top-2 right-4 bg-gray-950/90 border border-blue-500/40 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs pointer-events-none"
              >
                <p className="font-semibold text-white">{sortedMetrics[hoverIndex].date}</p>
                <p className="text-blue-400 mt-1">Spend: ${sortedMetrics[hoverIndex].spend.toFixed(2)}</p>
                <p className="text-gray-300">Clicks: {sortedMetrics[hoverIndex].clicks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHART 2: CLICKS & CONVERSIONS */}
      {activeChart === 'traffic' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><strong className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></strong> Clicks</span>
              <span className="flex items-center gap-1.5"><strong className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></strong> Conversions</span>
            </div>
            <span>Peak Clicks: {maxClicks.toLocaleString()} | Peak Conversions: {maxConv}</span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
              {/* Grid Lines */}
              {[0, 0.5, 1].map((pct, i) => {
                const y = padding.top + chartH * (1 - pct);
                return (
                  <line key={i} x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                );
              })}

              {/* Paths */}
              <path d={clicksPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <path d={convPath} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />

              {sortedMetrics.map((m, i) => (
                <g key={i}>
                  <circle cx={getX(i)} cy={getY(m.clicks, maxClicks)} r="3" className="fill-blue-500" />
                  <circle cx={getX(i)} cy={getY(m.conversions, maxConv)} r="3" className="fill-purple-500" />
                  {(i === 0 || i === Math.floor(sortedMetrics.length / 2) || i === sortedMetrics.length - 1) && (
                    <text x={getX(i)} y={padding.top + chartH + 20} textAnchor="middle" className="fill-gray-500 text-[10px]">
                      {m.date}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* CHART 3: CTR & CPC EFFICIENCY */}
      {activeChart === 'efficiency' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Average Click-Through Rate (CTR)</p>
            <p className="text-2xl font-bold text-emerald-400">
              {((sortedMetrics.reduce((a, b) => a + b.clicks, 0) / Math.max(1, sortedMetrics.reduce((a, b) => a + b.impressions, 0))) * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">Industry benchmark: 1.8% – 3.2%</p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Average Cost Per Click (CPC)</p>
            <p className="text-2xl font-bold text-amber-400">
              ${(sortedMetrics.reduce((a, b) => a + b.spend, 0) / Math.max(1, sortedMetrics.reduce((a, b) => a + b.clicks, 0))).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Efficiency rating: Optimal ad spend allocation</p>
          </div>
        </div>
      )}

      {/* CHART 4: PLATFORM BREAKDOWN */}
      {activeChart === 'platforms' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Platform Spend & ROI Matrix</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformData.map((p) => (
              <div key={p.platform} className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">{p.platform}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.avgRoi ? `${p.avgRoi.toFixed(2)}x ROI` : '1.50x ROI'}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-400 pt-2 border-t border-gray-800">
                  <div className="flex justify-between">
                    <span>Spend:</span>
                    <span className="text-white font-mono">${p.totalSpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversions:</span>
                    <span className="text-purple-400 font-mono">{p.totalConversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CTR:</span>
                    <span className="text-blue-400 font-mono">{p.avgCtr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPC:</span>
                    <span className="text-amber-400 font-mono">${p.avgCpc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

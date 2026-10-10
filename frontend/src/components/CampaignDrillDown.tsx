'use client';

import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_DAILY_METRICS } from '@/graphql/campaignMutations';

interface CampaignDrillDownProps {
  campaign: any;
  onClose: () => void;
}

export default function CampaignDrillDown({ campaign, onClose }: CampaignDrillDownProps) {
  const { data, loading } = useQuery<any>(GET_DAILY_METRICS, {
    variables: { campaignId: campaign.id },
    fetchPolicy: 'cache-and-network',
  });

  const metrics = data?.getDailyMetrics || [];

  // Aggregates
  const totalSpend = metrics.reduce((acc: number, m: any) => acc + Number(m.spend || 0), 0);
  const totalClicks = metrics.reduce((acc: number, m: any) => acc + Number(m.clicks || 0), 0);
  const totalImpressions = metrics.reduce((acc: number, m: any) => acc + Number(m.impressions || 0), 0);
  const totalConversions = metrics.reduce((acc: number, m: any) => acc + Number(m.conversions || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0.00';
  const estimatedRoi = totalSpend > 0 ? ((totalConversions * 45.0) / totalSpend).toFixed(2) : '1.50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start pb-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <h2 className="text-xl font-bold text-white">{campaign.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {campaign.platform}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Campaign ID #{campaign.id} • Allocated Budget: ${Number(campaign.budget).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition">
            ✕
          </button>
        </div>

        {/* Aggregated KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Total Spend</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">${totalSpend.toFixed(2)}</p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Total Clicks</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{totalClicks.toLocaleString()}</p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Avg CTR / CPC</p>
            <p className="text-sm font-bold text-white mt-1">
              {ctr}% <span className="text-gray-400 font-normal">/</span> ${cpc}
            </p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Calculated ROI</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{estimatedRoi}x</p>
          </div>
        </div>

        {/* Daily Metrics Log Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Historical Daily Performance Telemetry</h4>
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-xs">Loading campaign metrics...</div>
          ) : metrics.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl">
              No daily telemetry entries logged yet for this campaign.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Impressions</th>
                    <th className="py-2.5 px-4">Clicks</th>
                    <th className="py-2.5 px-4">Spend</th>
                    <th className="py-2.5 px-4">Conversions</th>
                    <th className="py-2.5 px-4">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                  {metrics.map((m: any) => {
                    const rowCtr = m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) : '0.00';
                    return (
                      <tr key={m.id} className="hover:bg-gray-800/20">
                        <td className="py-2.5 px-4 text-white font-mono">{m.date}</td>
                        <td className="py-2.5 px-4 text-gray-300">{Number(m.impressions).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-blue-400 font-mono">{Number(m.clicks).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-emerald-400 font-mono">${Number(m.spend).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-purple-400 font-mono">{m.conversions}</td>
                        <td className="py-2.5 px-4 text-amber-400 font-mono">{rowCtr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded-xl transition">
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
}

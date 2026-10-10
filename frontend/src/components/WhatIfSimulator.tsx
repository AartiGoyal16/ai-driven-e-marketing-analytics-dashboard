'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_WHAT_IF_ANALYSIS } from '@/graphql/campaignMutations';

export default function WhatIfSimulator() {
  const [platform, setPlatform] = useState('Google');
  const [selectedBudget, setSelectedBudget] = useState(5000);

  const { data, loading, error } = useQuery<any>(GET_WHAT_IF_ANALYSIS, {
    variables: {
      platform,
      baseBudget: selectedBudget,
      status: 'active',
      campaignObjective: 'conversions',
    },
    fetchPolicy: 'cache-first',
  });

  const analysis = data?.getWhatIfAnalysis;
  const scenarios = analysis?.scenarios || [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📈</span> What-If Elasticity Simulator
          </h3>
          <p className="text-xs text-gray-400">
            Simulate ad budget elasticity and discover the optimal ROI inflection point before diminishing returns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Google">Google Ads</option>
            <option value="Meta">Meta / Facebook</option>
            <option value="LinkedIn">LinkedIn Ads</option>
            <option value="TikTok">TikTok Ads</option>
            <option value="YouTube">YouTube Ads</option>
          </select>
        </div>
      </div>

      {/* Interactive Budget Slider */}
      <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-semibold uppercase">Proposed Budget Slider</span>
          <span className="text-blue-400 font-bold text-sm">${selectedBudget.toLocaleString()} USD</span>
        </div>
        <input
          type="range"
          min="500"
          max="50000"
          step="500"
          value={selectedBudget}
          onChange={(e) => setSelectedBudget(Number(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
          <span>$500</span>
          <span>$10,000</span>
          <span>$25,000</span>
          <span>$50,000</span>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500 text-xs animate-pulse">
          Simulating diminishing returns across 9 budget tiers...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-xs">
          Simulator warning: {error.message}
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-950 p-4 rounded-xl border border-blue-500/30">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Optimal Sweet Spot</p>
              <p className="text-2xl font-extrabold text-blue-400 mt-1">${analysis.optimal_budget.toLocaleString()}</p>
              <span className="text-[10px] text-gray-400">Peak marginal ROI return</span>
            </div>
            <div className="bg-gray-950 p-4 rounded-xl border border-emerald-500/30">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Peak Predicted ROI</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{analysis.optimal_roi.toFixed(2)}x</p>
              <span className="text-[10px] text-emerald-400/80">Maximum forecast multiplier</span>
            </div>
            <div className="bg-gray-950 p-4 rounded-xl border border-purple-500/30">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Scaling Insight</p>
              <p className="text-xs text-purple-300 mt-2">
                Budgets exceeding $15,000 experience diminishing conversion returns due to audience saturation.
              </p>
            </div>
          </div>

          {/* Scenario Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Budget Tier</th>
                  <th className="py-3 px-4">Predicted ROI</th>
                  <th className="py-3 px-4">Est. Clicks</th>
                  <th className="py-3 px-4">Est. Conversions</th>
                  <th className="py-3 px-4">Marginal Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                {scenarios.map((s: any) => {
                  const isOptimal = s.budget === analysis.optimal_budget;
                  return (
                    <tr key={s.budget} className={isOptimal ? 'bg-blue-500/10 font-semibold' : 'hover:bg-gray-800/30'}>
                      <td className="py-3 px-4 text-white font-mono flex items-center gap-2">
                        ${s.budget.toLocaleString()}
                        {isOptimal && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500 text-white font-sans uppercase">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-mono">{s.predicted_roi.toFixed(2)}x</td>
                      <td className="py-3 px-4 text-blue-300 font-mono">{s.predicted_clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-purple-300 font-mono">{s.predicted_conversions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-400">{s.marginal_efficiency}% efficiency</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

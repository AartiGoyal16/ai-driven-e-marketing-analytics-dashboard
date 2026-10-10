'use client';

import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_RECOMMENDATION } from '@/graphql/campaignMutations';

interface RecommendationCardProps {
  budget: number;
  objective?: string;
  audience?: string;
  onApplyPlatform?: (platform: string, budget: number) => void;
}

export default function RecommendationCard({
  budget,
  objective = 'conversions',
  audience = 'general_consumers',
  onApplyPlatform,
}: RecommendationCardProps) {
  const { data, loading, error } = useQuery<any>(GET_RECOMMENDATION, {
    variables: {
      budget: Number(budget) || 1000,
      campaignObjective: objective,
      targetAudience: audience,
    },
    fetchPolicy: 'cache-first',
  });

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-xs animate-pulse">
        🤖 Running prescriptive AI recommendation analysis across all 6 ad platforms...
      </div>
    );
  }

  if (error || !data?.getRecommendation) return null;

  const rec = data.getRecommendation;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-500/30 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <div>
            <h3 className="text-sm font-bold text-white">Prescriptive AI Campaign Recommendation</h3>
            <p className="text-[11px] text-gray-400">Targeted optimization engine based on historical cross-platform machine learning</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
          Best Pick: {rec.recommendedPlatform}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800/80 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Recommended Budget Allocation</p>
          <p className="text-xl font-extrabold text-blue-400">{rec.recommendedBudgetRange}</p>
          <p className="text-[11px] text-gray-400">Calibrated to avoid diminishing returns</p>
        </div>

        <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800/80 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-gray-400">Competitive Advantage</p>
          <p className="text-xs font-semibold text-emerald-300 mt-1">{rec.comparativeAdvantage}</p>
          <p className="text-[11px] text-gray-400">Peak expected ROI: {rec.bestPredictedRoi.toFixed(2)}x</p>
        </div>
      </div>

      {/* Platform Comparative Ranking */}
      <div className="space-y-2 pt-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Projected Platform Rankings</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rec.platformRankings.map((p: any, idx: number) => (
            <div
              key={p.platform}
              className={`p-3 rounded-xl border text-xs transition ${
                idx === 0
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/10'
                  : 'bg-gray-950/60 border-gray-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white flex items-center gap-1">
                  {idx === 0 && '👑'} {p.platform}
                </span>
                <span className="text-emerald-400 font-mono font-semibold">{p.predicted_roi.toFixed(2)}x</span>
              </div>
              <p className="text-[10px] text-gray-400">Clicks: {p.predicted_clicks.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Conv: {p.predicted_conversions.toLocaleString()}</p>

              {onApplyPlatform && idx === 0 && (
                <button
                  type="button"
                  onClick={() => onApplyPlatform(p.platform, budget)}
                  className="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-500 text-[10px] font-semibold rounded-lg text-white transition"
                >
                  Apply Recommendation
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

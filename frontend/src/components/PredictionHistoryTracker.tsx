'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_PREDICTION_HISTORY, GET_PREDICTION_STATS, UPDATE_ACTUAL_ROI_MUTATION } from '@/graphql/campaignMutations';

export default function PredictionHistoryTracker() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actualRoiInput, setActualRoiInput] = useState<string>('');

  const { data: statsData, refetch: refetchStats } = useQuery<any>(GET_PREDICTION_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: historyData, loading, refetch: refetchHistory } = useQuery<any>(GET_PREDICTION_HISTORY, {
    variables: { page: 1, limit: 15 },
    fetchPolicy: 'cache-and-network',
  });

  const [updateActualRoi, { loading: updating }] = useMutation(UPDATE_ACTUAL_ROI_MUTATION, {
    onCompleted: () => {
      setEditingId(null);
      setActualRoiInput('');
      refetchHistory();
      refetchStats();
    },
  });

  const stats = statsData?.getPredictionStats;
  const historyItems = historyData?.getPredictionHistory?.items || [];

  const handleSaveActualRoi = (id: string) => {
    const val = parseFloat(actualRoiInput);
    if (!isNaN(val) && val >= 0) {
      updateActualRoi({ variables: { id, actualRoi: val } });
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📜</span> Prediction History & Actual ROI Tracker
          </h3>
          <p className="text-xs text-gray-400">
            Audit historical AI forecasts against post-campaign realized performance to measure real-world precision.
          </p>
        </div>
      </div>

      {/* Aggregate Stats Bar */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Total Logged Forecasts</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalPredictions}</p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Avg Predicted ROI</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{stats.avgPredictedRoi.toFixed(2)}x</p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Avg Realized ROI</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.avgActualRoi.toFixed(2)}x</p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[10px] uppercase font-semibold text-gray-400">Completed Comparisons</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.completedComparisons}</p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Platform</th>
              <th className="py-3 px-4">Budget</th>
              <th className="py-3 px-4">Predicted ROI</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Actual Realized ROI</th>
              <th className="py-3 px-4">Variance / Delta</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Loading prediction telemetry...
                </td>
              </tr>
            ) : historyItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No prediction history recorded yet. Run a prediction to start tracking forecasts.
                </td>
              </tr>
            ) : (
              historyItems.map((item: any) => {
                const hasActual = item.actualRoi !== null && item.actualRoi !== undefined;
                const delta = hasActual ? item.actualRoi - item.predictedRoi : null;
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-white">{item.platform}</td>
                    <td className="py-3 px-4 font-mono text-blue-400">${item.budget.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-purple-400 font-bold">{item.predictedRoi.toFixed(2)}x</td>
                    <td className="py-3 px-4 text-amber-400 font-mono">{(item.confidenceScore * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 1.65"
                            value={actualRoiInput}
                            onChange={(e) => setActualRoiInput(e.target.value)}
                            className="w-20 px-2 py-1 bg-gray-900 border border-blue-500 rounded text-xs text-white outline-none"
                          />
                          <button
                            onClick={() => handleSaveActualRoi(item.id)}
                            disabled={updating}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px]"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : hasActual ? (
                        <span className="font-mono text-emerald-400 font-bold">{item.actualRoi.toFixed(2)}x</span>
                      ) : (
                        <span className="text-gray-500 italic">Campaign in flight</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {delta !== null ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            delta >= 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {delta >= 0 ? `+${delta.toFixed(2)}x` : `${delta.toFixed(2)}x`}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setActualRoiInput(hasActual ? item.actualRoi.toString() : '');
                          }}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] rounded-lg transition"
                        >
                          {hasActual ? 'Edit Actual' : '+ Log Actual'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

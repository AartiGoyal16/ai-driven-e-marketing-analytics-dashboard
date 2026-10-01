'use client';

import React, { useState } from 'react';
import { useQuery, useLazyQuery, useMutation, ApolloProvider } from '@apollo/client/react';
import {gql} from "@apollo/client";
import { useRouter } from 'next/navigation';

const GET_CAMPAIGN_PREDICTION = gql`
  query GetCampaignPrediction($platform: String!, $budget: Float!, $status: String!) {
    getCampaignPrediction(platform: $platform, budget: $budget, status: $status) {
      status
      message
      predictedRoi
      predictedClicks
      predictedConversions
      confidenceScore
    }
  }
`;

export default function DashboardPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState('Google');
  const [budget, setBudget] = useState('1000');
  const [status, setStatus] = useState('Active');

  const [fetchPrediction, { loading, data, error }] = useLazyQuery(GET_CAMPAIGN_PREDICTION, {
    fetchPolicy: 'network-only',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrediction({
      variables: {
        platform,
        budget: parseFloat(budget),
        status,
      },
    });
  };

  const prediction = data?.getCampaignPrediction;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Header */}
        <header className="flex justify-between items-center pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">AI Marketing Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Predict ROI and performance with cached ML inference</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm rounded-lg transition"
          >
            Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prediction Controls Form */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-400">Campaign Parameters</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Ad Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Google">Google Ads</option>
                  <option value="Meta">Meta / Facebook</option>
                  <option value="LinkedIn">LinkedIn Ads</option>
                  <option value="TikTok">TikTok Ads</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Budget ($USD)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Campaign Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 font-semibold rounded-lg shadow-md transition duration-150"
              >
                {loading ? 'Running ML Inference...' : 'Generate Prediction'}
              </button>
            </form>
          </div>

          {/* Results Display Area */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm">
                Failed to run prediction: {error.message}
              </div>
            )}

            {!prediction && !loading && !error && (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-800/40 border border-dashed border-gray-700 rounded-xl text-gray-500 text-sm">
                Configure parameters and submit to view AI-driven campaign forecasts.
              </div>
            )}

            {prediction && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Predicted ROI</p>
                    <p className="text-4xl font-extrabold text-green-400 mt-2">
                      {typeof prediction.predictedRoi === 'number'
                        ? `${prediction.predictedRoi.toFixed(2)}x`
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Estimated Clicks</p>
                    <p className="text-4xl font-extrabold text-blue-400 mt-2">
                      {typeof prediction.predictedClicks === 'number'
                        ? prediction.predictedClicks.toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Estimated Conversions</p>
                    <p className="text-4xl font-extrabold text-purple-400 mt-2">
                      {typeof prediction.predictedConversions === 'number'
                        ? prediction.predictedConversions.toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Model Confidence</p>
                    <p className="text-4xl font-extrabold text-amber-400 mt-2">
                      {typeof prediction.confidenceScore === 'number'
                        ? `${(prediction.confidenceScore * 100).toFixed(0)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Optional Microservice Banner Info */}
                {prediction.message && (
                  <div className="p-3 bg-gray-800/60 border border-gray-700/50 rounded-lg text-xs text-gray-400 flex justify-between items-center">
                    <span>
                      Engine Response: <strong className="text-gray-200">{prediction.status ?? 'Success'}</strong>
                    </span>
                    <span>{prediction.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
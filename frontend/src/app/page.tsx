'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import CampaignModal, { CampaignData } from '@/components/CampaignModal';
import {
  GET_ALL_CAMPAIGNS,
  GET_DAILY_METRICS,
  CREATE_CAMPAIGN_MUTATION,
  UPDATE_CAMPAIGN_MUTATION,
  DELETE_CAMPAIGN_MUTATION,
  ME_QUERY,
  LOGOUT_MUTATION,
} from '@/graphql/campaignMutations';

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
  const [activeTab, setActiveTab] = useState<'campaigns' | 'predictor' | 'metrics'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignData | null>(null);

  // Predictor Form State
  const [predPlatform, setPredPlatform] = useState('Google');
  const [predBudget, setPredBudget] = useState('1000');
  const [predStatus, setPredStatus] = useState('active');

  // GraphQL Hooks with Session Guard
  const { data: meData, loading: meLoading, error: meError } = useQuery<any>(ME_QUERY, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!meLoading && (!meData?.me || meError)) {
      router.push('/login?reason=expired');
    }
  }, [meLoading, meData, meError, router]);
  const { data: campaignsData, loading: campaignsLoading, refetch: refetchCampaigns } = useQuery<any>(
    GET_ALL_CAMPAIGNS,
    { fetchPolicy: 'cache-and-network' }
  );
  const { data: metricsData } = useQuery<any>(GET_DAILY_METRICS, { fetchPolicy: 'cache-and-network' });

  const [fetchPrediction, { loading: predLoading, data: predData, error: predError }] = useLazyQuery<any>(
    GET_CAMPAIGN_PREDICTION,
    { fetchPolicy: 'network-only' }
  );

  const [createCampaign, { loading: createLoading }] = useMutation(CREATE_CAMPAIGN_MUTATION, {
    onCompleted: () => {
      refetchCampaigns();
      setIsModalOpen(false);
    },
  });

  const [updateCampaign, { loading: updateLoading }] = useMutation(UPDATE_CAMPAIGN_MUTATION, {
    onCompleted: () => {
      refetchCampaigns();
      setIsModalOpen(false);
      setEditingCampaign(null);
    },
  });

  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN_MUTATION, {
    onCompleted: () => refetchCampaigns(),
  });

  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      router.push('/login');
      router.refresh();
    },
  });

  const handlePredictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrediction({
      variables: {
        platform: predPlatform,
        budget: parseFloat(predBudget),
        status: predStatus,
      },
    });
  };

  const handleSaveCampaign = (data: CampaignData) => {
    if (data.id) {
      updateCampaign({
        variables: {
          id: data.id,
          name: data.name,
          platform: data.platform,
          budget: Number(data.budget),
          status: data.status,
        },
      });
    } else {
      createCampaign({
        variables: {
          name: data.name,
          platform: data.platform,
          budget: Number(data.budget),
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign({ variables: { id } });
    }
  };

  const campaigns = campaignsData?.getAllCampaigns || [];
  const metrics = metricsData?.getDailyMetrics || [];
  const prediction = predData?.getCampaignPrediction;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'All' || c.platform.toLowerCase() === platformFilter.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  // Aggregated totals
  const totalBudget = campaigns.reduce((acc: number, c: any) => acc + Number(c.budget || 0), 0);
  const activeCount = campaigns.filter((c: any) => c.status?.toLowerCase() === 'active').length;

  // Render loading state while authenticating
  if (meLoading || !meData?.me) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-400">Verifying security credentials & active session...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Marketing Analytics Engine
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Microservices v1.0
                </span>
              </h1>
              <p className="text-xs text-gray-400">Decoupled Node.js Gateway + Python FastAPI Machine Learning</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {meData?.me && (
              <span className="text-xs text-gray-400 hidden sm:inline-block">
                Signed in as <strong className="text-gray-200">{meData.me.email}</strong>
              </span>
            )}
            <button
              onClick={() => logout()}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium transition duration-150"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Aggregated Key Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Campaigns</p>
            <p className="text-3xl font-extrabold text-white mt-2">{campaigns.length}</p>
            <span className="text-xs text-green-400 mt-1 inline-block">● {activeCount} Currently Active</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Allocated Budget</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">
              ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-gray-400 mt-1 inline-block">Across all ad platforms</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Predicted ROI</p>
            <p className="text-3xl font-extrabold text-purple-400 mt-2">1.35x</p>
            <span className="text-xs text-purple-400/80 mt-1 inline-block">Scikit-Learn Model Inference</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cache Status</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">Redis 7</p>
            <span className="text-xs text-emerald-400/80 mt-1 inline-block">TTL 3600s Active</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800 flex gap-6">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📋 Campaign Management
          </button>
          <button
            onClick={() => setActiveTab('predictor')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'predictor'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🤖 AI ROI Predictor
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📊 Daily Performance Metrics
          </button>
        </div>

        {/* TAB 1: CAMPAIGN MANAGEMENT (CRUD) */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                />

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All Platforms</option>
                  <option value="Google">Google Ads</option>
                  <option value="Meta">Meta / Facebook</option>
                  <option value="LinkedIn">LinkedIn Ads</option>
                  <option value="TikTok">TikTok Ads</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingCampaign(null);
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition duration-150 flex items-center gap-2"
              >
                <span>+</span> New Campaign
              </button>
            </div>

            {/* Campaign Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              {campaignsLoading ? (
                <div className="p-12 text-center text-gray-500">Loading campaigns from PostgreSQL...</div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <p className="text-base font-semibold">No campaigns found.</p>
                  <p className="text-xs">Create your first ad campaign to start tracking metrics and AI ROI forecasts.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="py-4 px-6">Campaign Name</th>
                        <th className="py-4 px-6">Platform</th>
                        <th className="py-4 px-6">Budget ($ USD)</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Created Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredCampaigns.map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-800/40 transition">
                          <td className="py-4 px-6 font-semibold text-white">{c.name}</td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-xs rounded-lg text-gray-300">
                              {c.platform}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-blue-400">
                            ${Number(c.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                c.status?.toLowerCase() === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : c.status?.toLowerCase() === 'paused'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-gray-400">
                            {c.created_at ? new Date(Number(c.created_at) || c.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingCampaign(c);
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-medium rounded-lg text-gray-300 border border-gray-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="px-3 py-1 bg-red-950/60 hover:bg-red-900 text-xs font-medium rounded-lg text-red-300 border border-red-800/50 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI ROI PREDICTOR */}
        {activeTab === 'predictor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                <span>🤖</span> Machine Learning Controls
              </h2>

              <form onSubmit={handlePredictSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Target Ad Platform
                  </label>
                  <select
                    value={predPlatform}
                    onChange={(e) => setPredPlatform(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Google">Google Ads</option>
                    <option value="Meta">Meta / Facebook</option>
                    <option value="LinkedIn">LinkedIn Ads</option>
                    <option value="TikTok">TikTok Ads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Proposed Budget ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={predBudget}
                    onChange={(e) => setPredBudget(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Campaign Status
                  </label>
                  <select
                    value={predStatus}
                    onChange={(e) => setPredStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={predLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition duration-150"
                >
                  {predLoading ? 'Running Scikit-Learn Model...' : 'Calculate AI Prediction'}
                </button>
              </form>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2 space-y-6">
              {predError && (
                <div className="p-4 bg-red-900/40 border border-red-500/40 rounded-2xl text-red-200 text-sm">
                  Failed to invoke AI Engine: {predError.message}
                </div>
              )}

              {!prediction && !predLoading && !predError && (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center bg-gray-900/40 border border-dashed border-gray-800 rounded-2xl text-gray-500 p-8 text-center space-y-2">
                  <span className="text-3xl">💡</span>
                  <p className="font-semibold text-gray-400">Ready to forecast ROI</p>
                  <p className="text-xs max-w-md">
                    Select your campaign parameters and submit to run Scikit-Learn regression model inference via Python FastAPI microservice.
                  </p>
                </div>
              )}

              {prediction && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Predicted ROI Multiplier</p>
                      <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                        {typeof prediction.predictedRoi === 'number'
                          ? `${prediction.predictedRoi.toFixed(2)}x`
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Estimated Clicks</p>
                      <p className="text-4xl font-extrabold text-blue-400 mt-2">
                        {typeof prediction.predictedClicks === 'number'
                          ? prediction.predictedClicks.toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Estimated Conversions</p>
                      <p className="text-4xl font-extrabold text-purple-400 mt-2">
                        {typeof prediction.predictedConversions === 'number'
                          ? prediction.predictedConversions.toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Confidence Score</p>
                      <p className="text-4xl font-extrabold text-amber-400 mt-2">
                        {typeof prediction.confidenceScore === 'number'
                          ? `${(prediction.confidenceScore * 100).toFixed(0)}%`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Love this forecast?</p>
                      <p className="text-xs text-gray-400">Launch a live campaign with these predicted parameters instantly.</p>
                    </div>
                    <button
                      onClick={() => {
                        handleSaveCampaign({
                          name: `Predicted ${predPlatform} Campaign`,
                          platform: predPlatform,
                          budget: parseFloat(predBudget),
                          status: predStatus,
                        });
                        setActiveTab('campaigns');
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
                    >
                      🚀 Convert into Live Campaign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DAILY PERFORMANCE METRICS */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">Daily Campaign Aggregates & CTR Performance</h2>
                <span className="text-xs text-gray-400">Aggregated from PostgreSQL daily_metrices table</span>
              </div>

              {metrics.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-2 border border-dashed border-gray-800 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-400">No daily performance metrics logged in PostgreSQL database.</p>
                  <p className="text-xs max-w-md mx-auto">
                    Run setupDB.js or insert daily metric entries into your PostgreSQL database to view CTR and CPC performance analytics.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {metrics.map((m: any) => {
                    const ctr = m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) : '0.00';
                    const cpc = m.clicks > 0 ? (m.spend / m.clicks).toFixed(2) : '0.00';
                    return (
                      <div key={m.id} className="bg-gray-950 border border-gray-800 rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-blue-400 uppercase">Date: {m.date}</span>
                          <span className="text-xs text-gray-500">ID #{m.campaign_id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400">Impressions</p>
                            <p className="text-base font-bold text-white">{Number(m.impressions).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Clicks</p>
                            <p className="text-base font-bold text-blue-400">{Number(m.clicks).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Spend</p>
                            <p className="text-base font-bold text-emerald-400">${Number(m.spend).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Conversions</p>
                            <p className="text-base font-bold text-purple-400">{Number(m.conversions)}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-800/80 flex justify-between text-xs text-gray-400">
                          <span>CTR: <strong className="text-white">{ctr}%</strong></span>
                          <span>CPC: <strong className="text-white">${cpc}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Campaign Create/Edit Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCampaign}
        initialData={editingCampaign}
        title={editingCampaign ? 'Edit Campaign Details' : 'Create New Ad Campaign'}
        loading={createLoading || updateLoading}
      />
    </main>
  );
}